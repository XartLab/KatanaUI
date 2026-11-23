#!/usr/bin/env bash
# SPDX-License-Identifier: MIT
# 一步装好本仓库锁定的 Playwright 浏览器（@playwright/test 1.56.1 要 chromium-1194 的 headless shell；组件截图、整页回归、e2e 都跑无头，只装它就够），并把 PLAYWRIGHT_BROWSERS_PATH 打印出来。
# 云会话沙箱的 /opt/pw-browsers 只有更新的 1243，没有 1194：过去的做法是把 1243 软链成 1194 凑上（/tmp/pwb），
# 但那样截图用的不是 runner 上的同一版 Chromium（runner 的镜像 playwright:v1.56.1 就是 1194，Chromium 141），像素会有微小差别，所以直接装真的。
# 用法（在仓库任意目录）：
#   eval "$(bash .claude/skills/verify-katanaui/scripts/pw-setup.sh)"   # 装好并 export 到当前 shell
#   KUI_PW_BROWSERS=/some/dir bash …/pw-setup.sh                         # 换安装目录，默认 ~/.cache/pw-browsers-katanaui
# 已经装过会秒过（playwright install 自己判断）；下载约 330 MB，走代理的沙箱里也能下（cdn.playwright.dev）。
# 进度写 stderr，stdout 只有最后一行 export，所以可以放心 eval。
set -euo pipefail
root="$(git rev-parse --show-toplevel)"
dir="${KUI_PW_BROWSERS:-$HOME/.cache/pw-browsers-katanaui}"
cd "$root/packages/react"
# 沙箱设了 PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1，要清掉才肯下载。
env -u PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD PLAYWRIGHT_BROWSERS_PATH="$dir" pnpm exec playwright install chromium-headless-shell >&2
echo "export PLAYWRIGHT_BROWSERS_PATH='$dir'"
