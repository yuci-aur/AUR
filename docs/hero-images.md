# Homepage hero image credits

The four rotating hero backdrops in `public/hero/` come from Wikimedia Commons.
Three carry CC BY / CC BY-SA licences, which **require attribution** wherever the
images are published. This file is the attribution record; keep it updated when a
slide is replaced.

Files are stored at ~3000–3840px wide because the hero is full-bleed. `next/image`
re-encodes and serves a right-sized WebP per viewport, so the large originals are
never sent to the browser.

| File | Source | Author | Licence |
|---|---|---|---|
| `hero_tokyo_hongo.jpg` | [Hongo Campus, University of Tokyo seen from Engineering Building 11](https://commons.wikimedia.org/wiki/File:Hongo_Campus,_University_of_Tokyo_seen_from_Engineering_Building_11.jpg) | Tokyo538 | CC0 (no attribution required) |
| `hero_ntu_singapore.jpg` | [Chinese Heritage Centre, October 2025](https://commons.wikimedia.org/wiki/File:Chinese_Heritage_Centre,_October_2025.jpg) (Nanyang Technological University) | GoAheadFan95 | CC BY-SA 4.0 |
| `hero_cuhk.jpg` | [Chinese University of Hong Kong 香港中文大學](https://commons.wikimedia.org/wiki/File:Chinese_University_of_Hong_Kong_%E9%A6%99%E6%B8%AF%E4%B8%AD%E6%96%87%E5%A4%A7%E5%AD%B8.JPG) | Citobun | CC BY-SA 3.0 |
| `hero_iit_kharagpur.jpg` | [Vikramshila Building, Srinivasa Ramanujan Complex, IIT Kharagpur](https://commons.wikimedia.org/wiki/File:Vikramshila_Building_-_Srinivasa_Ramanujan_Complex_-_Indian_Institute_of_Technology_-_Kharagpur_-_West_Midnapore_2015-01-24_4876.JPG) | Biswarup Ganguly | CC BY 3.0 |

## Before adding a slide

- **Landscape, >=2400px wide.** `object-cover` crops to the container, so tall or
  panoramic images lose most of their subject.
- **Check the licence.** Non-free files (many university logos on Wikipedia are
  hosted under fair use for the encyclopedia article only) are not usable here.
- **Add the row above,** including the author from the source page, if the licence
  is anything other than CC0 / public domain.
