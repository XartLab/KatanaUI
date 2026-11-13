// SPDX-License-Identifier: AGPL-3.0-only
// 组件卡 Controls · 快捷键方块。皮肤在 ../theme/kbd.css（照 OpenMarket tb-panels__key：20 高 · 圆角 4 · 6% 白底 12% 白边 · 10.5px 500）。
// 搬自 src/ui/Keys.tsx（#1860）：「Mod+Shift+H」怎么拆成块、Mod 在这个平台上叫什么，是应用的事（热键表在 src/hotkeys），这里只管画：调用方给拆好的块与读屏用的整串文字。

/** 一串快捷键方块：parts 是每一块上的字，label 是读屏读的整串。 */
export function Kbd({ parts, label }: { parts: readonly string[]; label: string }) {
  return (
    <span className="k-keys" aria-label={label}>
      {parts.map((key, index) => (
        <kbd className="k-kbd" key={index}>
          {key}
        </kbd>
      ))}
    </span>
  )
}
