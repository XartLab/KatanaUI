#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""生成 src/fonts/ark-pixel-12-zh-subset.woff2：方舟像素 12px 的中文子集。

字形数据取自 Ark Pixel Font（https://github.com/TakWolf/ark-pixel-font ，字体部分 SIL OFL 1.1，© 2021 TakWolf，
2026-11-14 读），用的是它仓库里 assets/glyphs/12/ 的点阵 PNG，没有跑它的构建脚本：这份脚本自己把每个黑点画成方块、
同一行连续的点合并成一个矩形、上下相同的矩形再合并，拼成 TrueType 轮廓。

子集：GB 2312 一级汉字（3755 个，行 0xB0–0xD7，最常用的那一档）加符号区（行 0xA1–0xA9）和全角形式（FF01–FF5E）。
方舟像素 12px 本来就没画太复杂的字（它 README 写明「部分复杂字形无法清晰绘制」），一级汉字里没有字形的字不进子集，
页面上落到 `--font-dot` 后面的无衬线。zh_cn 取字形的规则：同一码位有 `XXXX zh_hans.png`（或文件名里的语言列表含 zh_hans）就用它，
否则用没有语言后缀的 `XXXX.png`，只属于别的语言（zh_hant、ja、ko 等）的变体不用。

用法：python3 scripts/font/build-ark-pixel-subset.py <ark-pixel-font 检出目录> <输出 .woff2 路径>
依赖：fonttools、Pillow、brotli。
"""
import re
import sys
from pathlib import Path

from PIL import Image
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen

PX = 100  # 一个点 = 100 个字体单位，字号 12px = 1200 单位
UPM = 1200
ASCENT_ROWS = 10  # 12px 网格里基线以上 10 行、以下 2 行（assets/configs/fonts/12px.yaml 的 monospaced）
FAMILY = 'Ark Pixel 12 zh_cn Subset'


def gb2312_chars():
    out = []
    for hi in [*range(0xA1, 0xAA), *range(0xB0, 0xD8)]:
        for lo in range(0xA1, 0xFF):
            try:
                out.append(bytes([hi, lo]).decode('gb2312'))
            except UnicodeDecodeError:
                pass
    return out


def collect_files(root: Path):
    """码位 -> zh_cn 该用的 PNG。"""
    files = {}
    # common 里没有的全角形式（０–９、Ａ–Ｚ 之类）在 monospaced 里，宽度同样是 12 点
    sources = [root / 'assets/glyphs/12/cmap/common', root / 'assets/glyphs/12/cmap/monospaced']
    for p in (q for d in sources for q in d.rglob('*.png')):
        if 'monospaced' in p.parts and not 0xFF01 <= int(p.name.split('.')[0].split(' ')[0], 16) <= 0xFF5E:
            continue
        m = re.fullmatch(r'([0-9A-F]+)(?: ([a-z_,]+))?\.png', p.name)
        if not m:
            continue
        cp = int(m.group(1), 16)
        locales = m.group(2).split(',') if m.group(2) else None
        rank = 2 if locales and 'zh_hans' in locales else (1 if locales is None else 0)
        if rank and (cp not in files or rank > files[cp][0]):
            files[cp] = (rank, p)
    return {cp: p for cp, (_, p) in files.items()}


def rectangles(im: Image.Image):
    """点阵 -> 矩形列表 (x0, y0, x1, y1)，单位是点，y 向下。先按行合并连续点，再把上下相同的行段合并。"""
    a = im.getchannel('A')
    w, h = a.size
    px = a.load()
    open_runs = {}  # (x0, x1) -> y0
    rects = []
    for y in range(h + 1):
        runs = set()
        if y < h:
            x = 0
            while x < w:
                if px[x, y] > 127:
                    x0 = x
                    while x < w and px[x, y] > 127:
                        x += 1
                    runs.add((x0, x))
                else:
                    x += 1
        for key in list(open_runs):
            if key not in runs:
                rects.append((key[0], open_runs.pop(key), key[1], y))
        for key in runs:
            open_runs.setdefault(key, y)
    return rects


def main(src: Path, dst: Path):
    files = collect_files(src)
    wanted = {ord(c) for c in gb2312_chars()}
    wanted |= set(range(0xFF01, 0xFF5F))
    cps = sorted(cp for cp in wanted if cp in files)
    missing = sorted(wanted - set(files))
    print(f'子集 {len(cps)} 字，没有字形的 {len(missing)} 个', file=sys.stderr)

    glyph_order = ['.notdef'] + [f'uni{cp:04X}' for cp in cps]
    glyphs, metrics, cmap = {}, {}, {}
    notdef = src / 'assets/glyphs/12/notdef.png'
    for name, path, cp in [('.notdef', notdef, None)] + [(f'uni{cp:04X}', files[cp], cp) for cp in cps]:
        im = Image.open(path).convert('RGBA')
        pen = TTGlyphPen(None)
        for x0, y0, x1, y1 in rectangles(im):
            # 点阵 y 向下；字体 y 向上，基线在第 ASCENT_ROWS 行的下沿
            top = (ASCENT_ROWS - y0) * PX
            bottom = (ASCENT_ROWS - y1) * PX
            pen.moveTo((x0 * PX, bottom))
            pen.lineTo((x0 * PX, top))
            pen.lineTo((x1 * PX, top))
            pen.lineTo((x1 * PX, bottom))
            pen.closePath()
        glyphs[name] = pen.glyph()
        metrics[name] = (im.width * PX, 0)
        if cp is not None:
            cmap[cp] = name

    fb = FontBuilder(UPM, isTTF=True)
    fb.setupGlyphOrder(glyph_order)
    fb.setupCharacterMap(cmap)
    fb.setupGlyf(glyphs)
    fb.setupHorizontalMetrics(metrics)
    fb.setupHorizontalHeader(ascent=ASCENT_ROWS * PX, descent=-2 * PX)
    fb.setupNameTable(
        {
            'familyName': FAMILY,
            'styleName': 'Regular',
            'copyright': 'Copyright (c) 2021, TakWolf (https://takwolf.com). Subset by KatanaUI.',
            'licenseDescription': 'This Font Software is licensed under the SIL Open Font License, Version 1.1.',
            'licenseInfoURL': 'https://openfontlicense.org',
        }
    )
    fb.setupOS2(sTypoAscender=ASCENT_ROWS * PX, sTypoDescender=-2 * PX, usWinAscent=ASCENT_ROWS * PX, usWinDescent=2 * PX)
    fb.setupPost()
    fb.font.flavor = 'woff2'
    dst.parent.mkdir(parents=True, exist_ok=True)
    fb.save(str(dst))
    print(f'{dst}: {dst.stat().st_size} 字节', file=sys.stderr)


if __name__ == '__main__':
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(Path(sys.argv[1]), Path(sys.argv[2]))
