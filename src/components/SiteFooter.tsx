import type { PicksMeta } from "@/types";
import { formatDateDot } from "@/lib/picks";

/** ストーリーズ背景写真のクレジット（CREDITS.md と同期。CC BY は表示義務） */
const PHOTO_CREDITS: { title: string; author: string; license: string; url: string }[] = [
  { title: "Cozy modern bedroom…", author: "Shixart1985", license: "CC BY 2.0", url: "https://commons.wikimedia.org/wiki/File:Cozy_modern_bedroom_with_plush_pillows_and_elegant_drapes_in_bright_daylight.jpg" },
  { title: "Laundry time", author: "Infrogmation of New Orleans", license: "CC BY 2.0", url: "https://commons.wikimedia.org/wiki/File:Laundry_time.jpg" },
  { title: "Middle-aged businesswoman typing…", author: "Shixart1985", license: "CC BY 2.0", url: "https://commons.wikimedia.org/wiki/File:Middle-aged_businesswoman_typing_on_laptop_at_home_office.jpg" },
  { title: "Healthy Grocery Shopping", author: "leonie wise", license: "CC0", url: "https://commons.wikimedia.org/wiki/File:Healthy_Grocery_Shopping_(Unsplash).jpg" },
  { title: "Technics EAH-AZ60M2", author: "RuinDig/Yuki Uchida", license: "CC BY 4.0", url: "https://commons.wikimedia.org/wiki/File:Technics-EAH-AZ60M2_09.jpg" },
  { title: "Hair Dryer", author: "NIST", license: "Public domain", url: "https://commons.wikimedia.org/wiki/File:Hair_Dryer_(8622935150).jpg" },
  { title: "Xiaomi Mi Robot Vacuum Cleaner", author: "Raysonho", license: "CC0", url: "https://commons.wikimedia.org/wiki/File:XiaomiMiRobotVacuumCleanerRobot.jpg" },
  { title: "Chopping fresh peppers…", author: "Shixart1985", license: "CC BY 2.0", url: "https://commons.wikimedia.org/wiki/File:Chopping_fresh_peppers_in_a_rustic_kitchen_during_a_vibrant_cooking_session_in_the_countryside.jpg" },
  { title: "Good Things Come to Those Who Hustle", author: "Hannah Wei", license: "CC0", url: "https://commons.wikimedia.org/wiki/File:Good_Things_Come_to_Those_Who_Hustle_(Unsplash).jpg" },
];

/**
 * フッター：このサイトの成り立ち・凡例・写真クレジット。
 * 「何を基準に選んでいるか」が見えることが、キュレーション物の信頼の土台。
 */
export function SiteFooter({ meta, count }: { meta: PicksMeta; count: number }) {
  return (
    <footer className="site-footer">
      <div className="wrap foot-in">
        <section className="foot-col">
          <h3 className="mincho">このサイトについて</h3>
          <p>
            {meta.description}。Web上の「買ってよかった」まとめや製品レビューを毎朝自動収集し、
            原則として複数の出典で確認できたものを収録しています（注目株として出典1件のものも一部含みます）。
            掲載は紹介であり、広告・アフィリエイトは含みません。
          </p>
          <p className="foot-stats num">
            収録 {count} 点 · 最終更新 {formatDateDot(meta.lastUpdated)}
          </p>
        </section>

        <section className="foot-col">
          <h3 className="mincho">凡例</h3>
          <dl className="legend">
            <dt>信頼度</dt>
            <dd>
              {Object.entries(meta.trustLegend)
                .sort(([a], [b]) => Number(b) - Number(a))
                .map(([k, v]) => (
                  <span key={k}>
                    <b className="num">★{k}</b> {v}
                  </span>
                ))}
            </dd>
            <dt>価格帯</dt>
            <dd>
              {Object.entries(meta.priceLegend).map(([k, v]) => (
                <span key={k}>
                  <b className="num">{"¥".repeat(Number(k))}</b> {v}
                </span>
              ))}
            </dd>
            <dt>状態</dt>
            <dd>
              <span>「気になる／買った／スルー」は自分で付ける印です。この端末と共有ルームに保存されます。</span>
            </dd>
          </dl>
        </section>

        <section className="foot-col">
          <h3 className="mincho">写真クレジット</h3>
          <p>ダイジェストの背景写真は Wikimedia Commons の自由ライセンス画像に色調を重ねて使用しています。</p>
          <ul className="credits">
            {PHOTO_CREDITS.map((c) => (
              <li key={c.url}>
                <a href={c.url} target="_blank" rel="noreferrer">
                  {c.title}
                </a>{" "}
                — {c.author}（{c.license}）
              </li>
            ))}
          </ul>
        </section>
      </div>
      <div className="wrap foot-bottom">
        <span className="mincho">{meta.title}</span>
        <span className="en">Quality Goods Index</span>
      </div>
    </footer>
  );
}
