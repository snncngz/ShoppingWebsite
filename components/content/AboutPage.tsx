import { Breadcrumbs } from "@/components/category/Breadcrumbs";
import { BRAND_NAME } from "@/lib/constants";

export function AboutPage() {
  return (
    <article className="bg-ivory">
      <section className="relative min-h-[70vh] overflow-hidden bg-charcoal lg:min-h-[80vh]">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/placeholders/canta.svg"
            alt="Lucien Perrin çanta, butik vitrin görseli"
            className="h-full w-full origin-center scale-125 object-cover object-[center_28%]"
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>
        <div className="relative mx-auto flex min-h-[70vh] max-w-7xl flex-col justify-end px-6 pb-16 pt-32 lg:min-h-[80vh] lg:px-8 lg:pb-24">
          <p className="text-12 tracking-label text-ivory/80">Marka</p>
          <h1 className="mt-4 max-w-2xl font-heading text-48 text-ivory lg:text-64">
            Sessiz bir lüks.
          </h1>
          <p className="mt-6 max-w-lg text-16 text-ivory/85">
            {BRAND_NAME}, siluet, koku ve aksesuarı aynı dilde konuşturan
            Nişantaşı butiği. Yüksek sesle değil, dokunuşla hatırlanır.
          </p>
        </div>
      </section>

      <section className="px-6 py-16 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <Breadcrumbs
            items={[
              { label: "Anasayfa", href: "/" },
              { label: "Hakkımızda", href: "/hakkimizda" },
            ]}
          />
        </div>
      </section>

      <section className="px-6 pb-24 lg:px-8 lg:pb-32">
        <div className="mx-auto max-w-3xl">
          <p className="text-12 tracking-label text-taupe">Felsefe</p>
          <h2 className="mt-3 font-heading text-32 text-black lg:text-48">
            Az parça, doğru duruş.
          </h2>
          <p className="mt-8 text-16 text-charcoal">
            Lucien Perrin bir sezonun gürültüsüne yetişmek için kurulmadı. Gardırobun
            her sabah yeniden düşünülmesini gerektiren parçalar yerine, elinizin
            alıştığı kumaşı, bileğinizin tanıdığı tokayı, cildinizin hatırladığı
            kokuyu arar. Sakin lüks; gösterişten değil, seçimin netliğinden
            gelir.
          </p>
          <p className="mt-6 text-16 text-charcoal">
            Bir tişörtün omuz düşüşü, bir pantolonun paça kırılması ve bir
            parfümün dip notası aynı odada durabilmeli. Bu yüzden koleksiyon
            kısa tutulur: her form, her koku, her aksesuar diğerini bozmadan
            tamamlar.
          </p>
        </div>
      </section>

      <section className="bg-off-white px-6 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-24">
          <div className="relative aspect-[4/5] overflow-hidden bg-ivory">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/placeholders/tshirt.svg"
              alt="Lucien Perrin tişört silueti"
              className="h-full w-full object-cover object-top"
            />
          </div>
          <div className="max-w-lg">
            <p className="text-12 tracking-label text-taupe">Hikaye</p>
            <h2 className="mt-3 font-heading text-32 text-black lg:text-48">
              Atölyeden caddeye
            </h2>
            <p className="mt-6 text-16 text-charcoal">
              2019’da Teşvikiye’de, eski bir terzi atölyesinin üst katında iki
              kurucu Lucien Perrin butiğini açtı. Biri kumaş ve kalıpla, diğeri koku
              aileleriyle çalışıyordu. Amaç bir “her şey mağazası” değil;
              giyim, parfüm ve aksesuarın aynı masada karar verildiği küçük bir
              butikti.
            </p>
            <p className="mt-4 text-16 text-charcoal">
              İlk sezon yalnızca sekiz tişört, üç kemer ve tek bir amber
              parfümle çıktı. Müşteriler parçaları ayrı ayrı değil, bir arada
              taşımak istedi. O günden beri koleksiyon büyüdü; dil değişmedi.
              Hâlâ Nişantaşı’nda, hâlâ seçerek.
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <p className="text-12 tracking-label text-taupe">Değerler</p>
          <h2 className="mt-3 max-w-xl font-heading text-32 text-black lg:text-48">
            Koleksiyonu ayakta tutan üç söz.
          </h2>
          <ul className="mt-16 grid gap-12 md:grid-cols-3">
            <li>
              <p className="text-12 tracking-label text-accent">01</p>
              <h3 className="mt-4 font-heading text-24 text-black">Özen</h3>
              <p className="mt-4 text-16 text-charcoal">
                Her parça, rafta durduğu için değil, yıllarca giyileceği için
                seçilir. Dikiş payı, astar ve koku konsantrasyonu aynı titizlikle
                bakılır.
              </p>
            </li>
            <li>
              <p className="text-12 tracking-label text-accent">02</p>
              <h3 className="mt-4 font-heading text-24 text-black">Doku</h3>
              <p className="mt-4 text-16 text-charcoal">
                Merino, pima, dana derisi, süet ve reçineli amber. Elin
                hatırladığı yüzey, tarza sözcüklerden daha çabuk yerleşir.
              </p>
            </li>
            <li>
              <p className="text-12 tracking-label text-accent">03</p>
              <h3 className="mt-4 font-heading text-24 text-black">Zaman</h3>
              <p className="mt-4 text-16 text-charcoal">
                Trend takvimi yerine mevsimin ritmi. Bir pantolon üç kış
                taşınabilmeli; bir parfüm, günün farklı saatlerinde açılmalı.
              </p>
            </li>
          </ul>
        </div>
      </section>

      <section className="bg-off-white px-6 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-24">
          <div className="max-w-lg lg:order-1">
            <p className="text-12 tracking-label text-taupe">İşçilik</p>
            <h2 className="mt-3 font-heading text-32 text-black lg:text-48">
              Kalıp, deri, koku.
            </h2>
            <p className="mt-6 text-16 text-charcoal">
              Giyimde kalıp İtalyan ve Türk atölyelerinde, düşük adetle üretilir.
              Kemer ve çantalarda dana derisi elde kesilir; tokalar fırçalanmış
              metaldir, parlak krom değil. Parfümler ise küçük partiler halinde,
              odunsu ve çiçeksi ailelerden seçilir — vitrine değil, cilde göre.
            </p>
            <p className="mt-4 text-16 text-charcoal">
              Kusursuzluk iddiası yok. Duruş var: dikişin düzgünlüğü, flakonun
              ağırlığı, bir kemerin belde kaymaması.
            </p>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden bg-ivory lg:order-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/placeholders/parfum.svg"
              alt="Lucien Perrin parfüm flakonu"
              className="h-full w-full object-cover object-center"
            />
          </div>
        </div>
      </section>

      <section className="px-6 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-24">
          <div className="relative aspect-[3/4] overflow-hidden bg-off-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/placeholders/kemer.svg"
              alt="Lucien Perrin deri kemer detayı"
              className="h-full w-full origin-[center_48%] scale-125 object-cover object-[center_48%]"
            />
          </div>
          <div className="max-w-lg">
            <p className="text-12 tracking-label text-taupe">Yaşam</p>
            <h2 className="mt-3 font-heading text-32 text-black lg:text-48">
              Sabahın tişörtü, akşamın amber’i.
            </h2>
            <p className="mt-6 text-16 text-charcoal">
              Lucien Perrin, özel gece için ayrılan bir marka değil. Kahveyle çıkan
              oversize bir tişört, ofiste duran tailored bir pantolon, akşam
              bilekte kalan bir kemer ve ceket yakasına sinen odunsu bir koku —
              hepsi aynı günün içinde yerini bulur.
            </p>
            <p className="mt-4 text-16 text-charcoal">
              Modern yaşam hızlıdır; gardırop öyle olmak zorunda değil. Az
              sayıda, birbirini tanıyan parçalar; şehrin temposunda sakin duran
              bir ritim.
            </p>
          </div>
        </div>
      </section>
    </article>
  );
}
