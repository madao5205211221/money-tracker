# -*- coding: utf-8 -*-
"""生成阿英记账的安卓自适应图标 + 传统图标（铺满，无绿边）。

策略：
  - 自适应图标 (adaptive icon) 由 background + foreground 两层组成。
    Google 规范里 foreground 的安全区只有中心 66x66/108，四周会被系统裁掉。
    为了让画面"铺满"，我们把前景的可见方形放大到接近 100/108，
    并让背景层用同一张图放大填充 —— 这样任何裁切形状下都不会露出纯色边。
  - 传统图标 (ic_launcher.png / ic_launcher_round.png) 直接铺满整张方图 / 圆图。
"""
import os
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RES = os.path.join(ROOT, 'android', 'app', 'src', 'main', 'res')
CACHE = os.path.join(ROOT, 'assets')

# 源裁剪图（用户指定：全身坐姿那张）
SRC = r'C:\Users\lxy\.workbuddy\clipboard-images\clipboard-2026-10-04T10-51-02-346Z-b8e3fedd.jpg'

# 裁剪窗口（相对原图宽高的比例）—— 只取人物主体，忽略右侧桌面
#   x: 0.22 ~ 0.79   y: 0.20 ~ 0.92
BOX = (0.22, 0.20, 0.79, 0.92)

# 自适应图标规范
ADAPTIVE_TOTAL = 108   # 规范基准
ADAPTIVE_VISIBLE = 72  # 圆形/方形可见直径
# 前景里有效方形的边长（相对 108）。设为 96 表示画面几乎铺满、
# 只在极端裁切（圆形/水滴）时裁掉最外圈。
FG_CONTENT = 96


def square_crop(im, box):
    """按比例框裁出正方形（以中心为准外扩到正方形）。"""
    w, h = im.size
    x0, y0, x1, y1 = box
    left, top = int(w * x0), int(h * y0)
    right, bottom = int(w * x1), int(h * y1)
    cw, ch = right - left, bottom - top
    side = min(cw, ch)
    # 以裁剪框中心为基准取正方形
    cx, cy = (left + right) // 2, (top + bottom) // 2
    left = cx - side // 2
    top = cy - side // 2
    left = max(0, min(left, w - side))
    top = max(0, min(top, h - side))
    return im.crop((left, top, left + side, top + side))


def build_master():
    im = Image.open(SRC).convert('RGB')
    sq = square_crop(im, BOX)
    print('square crop:', sq.size)
    master = sq.resize((1024, 1024), Image.LANCZOS)
    master.save(os.path.join(CACHE, 'icon_master.png'))
    return master


# 各密度对应的传统图标尺寸
DENSITIES = {
    'mdpi': 48,
    'hdpi': 72,
    'xhdpi': 96,
    'xxhdpi': 144,
    'xxxhdpi': 192,
}
# 自适应图标各密度总尺寸（108dp 基准）
ADAPTIVE_DENSITIES = {
    'mdpi': 108,
    'hdpi': 162,
    'xhdpi': 216,
    'xxhdpi': 324,
    'xxxhdpi': 432,
}


def main():
    master = build_master()

    for name, size in DENSITIES.items():
        d = os.path.join(RES, 'mipmap-' + name)
        os.makedirs(d, exist_ok=True)

        legacy = master.resize((size, size), Image.LANCZOS)
        legacy.save(os.path.join(d, 'ic_launcher.png'))

        # 圆形版本：铺满整圆
        big = size * 4
        canvas = master.resize((big, big), Image.LANCZOS)
        mask = Image.new('L', (big, big), 0)
        ImageDraw.Draw(mask).ellipse((0, 0, big - 1, big - 1), fill=255)
        rnd = Image.new('RGBA', (big, big), (0, 0, 0, 0))
        rnd.paste(canvas, (0, 0), mask)
        rnd = rnd.resize((size, size), Image.LANCZOS)
        rnd.save(os.path.join(d, 'ic_launcher_round.png'))

        # 自适应前景：内容方形铺到 FG_CONTENT/108，中心对齐
        total = ADAPTIVE_DENSITIES[name]
        content = int(round(total * FG_CONTENT / ADAPTIVE_TOTAL))
        fg = Image.new('RGBA', (total, total), (0, 0, 0, 0))
        art = master.resize((content, content), Image.LANCZOS)
        off = (total - content) // 2
        fg.paste(art, (off, off))
        fg.save(os.path.join(d, 'ic_launcher_foreground.png'))
        print(f'{name}: total={total} content={content}')

    # 自适应背景：同一张图放大，确保任何裁切下都不会露纯色边
    # （也可用纯色，但铺满要求下图片更稳）
    bgs = Image.new('RGB', (1024, 1024))
    # 放大到 108 的 1.12 倍再居中裁，避免边缘拉伸
    zoom = master.resize((1147, 1147), Image.LANCZOS)
    bgs.paste(zoom, (-62, -62))
    bgs.save(os.path.join(CACHE, 'icon_background.png'))

    # 启动图（splash）：居中留白版本保持原逻辑，简单铺一张
    splash = Image.new('RGB', (2732, 2732), (247, 244, 239))
    s = master.resize((900, 900), Image.LANCZOS)
    splash.paste(s, ((2732 - 900) // 2, (2732 - 900) // 2))
    splash.save(os.path.join(CACHE, 'splash.png'))

    print('done')


if __name__ == '__main__':
    main()
