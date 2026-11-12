# Litpasong price images and video (no Orshot render credits needed)

Rebuilds the three Orshot templates locally:
- 30408 square price card 2576x2576 (Facebook) -> make_price_image.py
- 40940 TikTok vertical 1080x1920               -> make_social_media.py vertical
- 40976 YouTube Shorts 17.7 s with shop song    -> make_social_media.py video

```
pip install pillow fonttools --break-system-packages   # ffmpeg must be installed for the video
cd tools/price-image
python3 make_price_image.py --baht "44,650,000" --salung "11,260,000" --bar "44,600,000" \
  --date "12-11-2026" --time "10:00" --out /tmp/square.jpg
python3 make_social_media.py vertical --card /tmp/square.jpg --date 12/11/2026 --out /tmp/tiktok.jpg
python3 make_social_media.py video    --card /tmp/square.jpg --date 12/11/2026 --out /tmp/short.mp4
```

Hosting for Metricool: upload each file with Orshot orshot_create_upload_url + curl PUT +
orshot_confirm_upload (free, does not use render credits) and use the returned direct_url.
The square card is 2576 px; it is fine for Facebook. TikTok must stay at 1080x1920 or smaller.

assets/: Toby's blank background, the 15 shop photos, the shop song (litpasong-theme-v2),
Noto Sans Lao / Lao Looped / Noto Sans fonts (SIL Open Font License).
