# Litpasong daily gold price image (no Orshot needed)

Makes the same 2576x2576 image as Orshot template 30408, locally and for free.

```
pip install pillow fonttools --break-system-packages
python3 tools/price-image/make_price_image.py --baht "44,650,000" --salung "11,260,000" \
  --bar "44,600,000" --date "12-11-2026" --time "10:00" --out posts/price-YYYY-MM-DD-HHMM.jpg
```

Commit the image into `posts/` and push; Metricool can then use
`https://raw.githubusercontent.com/tobienar-cloud/litpasong/main/posts/<file>.jpg`.
TikTok needs a 1080x1080 copy (max 1080p). Fonts: Noto Sans Lao Looped + Noto Sans (SIL OFL).
