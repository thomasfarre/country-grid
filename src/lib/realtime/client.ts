import type { RealtimeChannel } from "@supabase/supabase-js";
import { hasSupabaseClient, supabaseClient } from "../supabaseClient";
import type { ClientMsg, ServerMsg } from "../game/types";

export type ClientEnvelope = {
  clientId: string;
  message: ClientMsg;
};

export type ServerEnvelope = {
  message: ServerMsg;
};

export type PresenceMeta = {
  nickname: string;
  clientId: string;
  joinedAt: number;
};

export type JoinRoomOptions = {
  roomId: string;
  clientId: string;
  nickname: string;
  onServerMessage: (message: ServerMsg) => void;
  onClientMessage?: (envelope: ClientEnvelope) => void;
  onPresenceChange?: (state: Record<string, PresenceMeta[]>) => void;
};

export type RoomConnection = {
  channel: RealtimeChannel | null;
  sendClientMessage: (message: ClientMsg) => Promise<void>;
  sendServerMessage: (message: ServerMsg) => Promise<void>;
  leave: () => Promise<void>;
};

const channelName = (roomId: string) => `room:${roomId}`;

const useMockRealtime =
  process.env.NEXT_PUBLIC_USE_MOCK_REALTIME === "true" || !hasSupabaseClient;

const broadcastChannelAvailable = typeof BroadcastChannel !== "undefined";

type MockPresenceMessage =
  | { type: "announce"; meta: PresenceMeta }
  | { type: "leave"; clientId: string }
  | { type: "sync"; state: PresenceMeta[] }
  | { type: "request-sync"; requester: string };

type MockBroadcastMessage =
  | { type: "client"; payload: ClientEnvelope }
  | { type: "server"; payload: ServerEnvelope };

const createMockConnection = async ({
  roomId,
  clientId,
  nickname,
  onServerMessage,
  onClientMessage,
  onPresenceChange
}: JoinRoomOptions): Promise<RoomConnection> => {
  if (!broadcastChannelAvailable) {
    throw new Error("BroadcastChannel is required for mock realtime");
  }

  const channelKey = channelName(roomId);
  const broadcastChannel = new BroadcastChannel(channelKey);
  const presenceChannel = new BroadcastChannel(`${channelKey}:presence`);
  const presenceMap = new Map<string, PresenceMeta>();
  let active = true;

  const emitPresence = () => {
    if (!onPresenceChange) return;
    const record: Record<string, PresenceMeta[]> = {};
    presenceMap.forEach((meta, id) => {
      record[id] = [meta];
    });
    onPresenceChange(record);
  };

  presenceChannel.onmessage = (event) => {
    if (!active) return;
    const data = event.data as MockPresenceMessage;
    switch (data.type) {
      case "announce":
        presenceMap.set(data.meta.clientId, data.meta);
        emitPresence();
        break;
      case "leave":
        presenceMap.delete(data.clientId);
        emitPresence();
        break;
      case "sync":
        presenceMap.clear();
        data.state.forEach((meta) => presenceMap.set(meta.clientId, meta));
        emitPresence();
        break;
      case "request-sync":
        if (data.requester !== clientId) {
          presenceChannel.postMessage({
            type: "sync",
            state: Array.from(presenceMap.values())
          } satisfies MockPresenceMessage);
        }
        break;
      default:
        break;
    }
  };

  broadcastChannel.onmessage = (event) => {
    if (!active) return;
    const data = event.data as MockBroadcastMessage;
    if (data.type === "server") {
      onServerMessage(data.payload.message);
    } else if (data.type === "client" && onClientMessage) {
      onClientMessage(data.payload);
    }
  };

  const meta: PresenceMeta = { nickname, clientId, joinedAt: Date.now() };
  presenceMap.set(clientId, meta);
  emitPresence();
  presenceChannel.postMessage({ type: "announce", meta } satisfies MockPresenceMessage);
  presenceChannel.postMessage({ type: "request-sync", requester: clientId } satisfies MockPresenceMessage);

  const sendClientMessage = async (message: ClientMsg) => {
    if (!active) return;
    broadcastChannel.postMessage({ type: "client", payload: { clientId, message } } satisfies MockBroadcastMessage);
  };

  const sendServerMessage = async (message: ServerMsg) => {
    if (!active) return;
    broadcastChannel.postMessage({ type: "server", payload: { message } } satisfies MockBroadcastMessage);
  };

  const leave = async () => {
    if (!active) return;
    active = false;
    presenceMap.delete(clientId);
    emitPresence();
    presenceChannel.postMessage({ type: "leave", clientId } satisfies MockPresenceMessage);
    broadcastChannel.close();
    presenceChannel.close();
  };

  return {
    channel: null,
    sendClientMessage,
    sendServerMessage,
    leave
  };
};

const createSupabaseConnection = async ({
  roomId,
  clientId,
  nickname,
  onServerMessage,
  onClientMessage,
  onPresenceChange
}: JoinRoomOptions): Promise<RoomConnection> => {
  if (!supabaseClient) {
    throw new Error("Supabase client not initialised");
  }

  const channel = supabaseClient.channel(channelName(roomId), {
    config: {
      presence: {
        key: clientId
      }
    }
  });

  channel.on("broadcast", { event: "server" }, ({ payload }) => {
    if (!payload) return;
    const data = payload as ServerEnvelope;
    onServerMessage(data.message);
  });

  if (onClientMessage) {
    channel.on("broadcast", { event: "client" }, ({ payload }) => {
      if (!payload) return;
      const data = payload as ClientEnvelope;
      onClientMessage(data);
    });
  }

  if (onPresenceChange) {
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState<PresenceMeta>();
      onPresenceChange(state);
    });
  }

  await channel.subscribe(async (status) => {
    if (status === "SUBSCRIBED") {
      const meta: PresenceMeta = { nickname, clientId, joinedAt: Date.now() };
      await channel.track(meta);
    }
  });

  const sendClientMessage = async (message: ClientMsg) => {
    await channel.send({
      type: "broadcast",
      event: "client",
      payload: { clientId, message }
    });
  };

  const sendServerMessage = async (message: ServerMsg) => {
    await channel.send({
      type: "broadcast",
      event: "server",
      payload: { message }
    });
  };

  const leave = async () => {
    await channel.untrack();
    await channel.unsubscribe();
  };

  return {
    channel,
    sendClientMessage,
    sendServerMessage,
    leave
  };
};

export const joinRoom = async (options: JoinRoomOptions): Promise<RoomConnection> => {
  if (useMockRealtime) {
    return createMockConnection(options);
  }
  return createSupabaseConnection(options);
};
