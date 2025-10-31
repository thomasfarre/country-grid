#!/bin/sh
if [ -z "$husky_skip_init" ]; then
  debug () {
    [ "$HUSKY_DEBUG" = "1" ] && echo "husky (debug) - $1"
  }

  readonly hook_name="$(basename "$0")"
  case $husky_skip_init in
    1|true)
      debug "Skipping Husky init - SKIP="$husky_skip_init""
      return
      ;;
  esac

  export husky_skip_init=1
  sh -e "$0" "$@"
  exitCode="$?"
  unset husky_skip_init
  exit "$exitCode"
fi
