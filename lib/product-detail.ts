import type { Product } from "@/types";

export function getRelatedProducts(
  product: Product,
  catalog: Product[],
  count = 4,
): Product[] {
  const sameCategory = catalog.filter(
    (item) => item.category === product.category && item.id !== product.id,
  );

  if (sameCategory.length >= count) {
    return sameCategory.slice(0, count);
  }

  const extras = catalog.filter(
    (item) => item.id !== product.id && item.category !== product.category,
  );

  return [...sameCategory, ...extras].slice(0, count);
}

export function getAccordionContent(product: Product): {
  id: string;
  title: string;
  body: string;
}[] {
  const material = getMaterialCopy(product.category);
  const care = getCareCopy(product.category);

  return [
    {
      id: "description",
      title: "Ürün Açıklaması",
      body: product.description,
    },
    {
      id: "details",
      title: "Ürün Detayları",
      body: `${product.name}, ${product.category} koleksiyonunun ${product.subcategory.toLowerCase()} hattında yer alır. ${product.colors.join(", ")} seçenekleriyle sunulur. Her parça Lucien Perrin atölye standartlarında, sınırlı adetlerle üretilir.`,
    },
    {
      id: "material",
      title: "Materyal",
      body: material,
    },
    {
      id: "care",
      title: "Bakım",
      body: care,
    },
    {
      id: "shipping",
      title: "Kargo ve Teslimat",
      body: "Siparişler 1–3 iş günü içinde hazırlanır. Türkiye içi teslimat genellikle 2–5 iş günü sürer. Kargo paketi, ürünü koruyacak şekilde sade ve geri dönüştürülebilir malzemelerle hazırlanır. Teslimat bilgileri sipariş onay e-postasında yer alır.",
    },
    {
      id: "returns",
      title: "İade ve Değişim",
      body: "Kullanılmamış ürünleri teslimattan itibaren 14 gün içinde iade veya değişim için gönderebilirsiniz. Parfümlerde hijyen nedeniyle yalnızca mührü açılmamış şişeler kabul edilir. İade süreci için siparişlerim sayfasından talep oluşturmanız yeterlidir.",
    },
  ];
}

function getMaterialCopy(category: string): string {
  switch (category) {
    case "T-Shirt":
      return "Seçilmiş pamuk, modal ve merino karışımları kullanılır. Kumaşlar nefes alır, formunu korur ve tenle yumuşak bir temas bırakır. Dikişler ince, yakalar ise yıkamaya dayanıklı olacak şekilde çalışılır.";
    case "Pantolon":
      return "Yün, viskon ve streç karışımlı dokumalar; akışkan krep ve mat saten seçenekleri. Kumaş dökümü terziliği bozmadan durur, bel bandı ve paça bitişleri ölçülü tutulur.";
    case "Parfüm":
      return "Alkol bazlı eau de parfum ve essence formülasyonları. Doğal özler ve özenle dengelenmiş sentetik notalar, ciltte kalıcı ama bağırgan olmayan bir iz bırakmak için bir araya getirilir.";
    case "Kemer":
      return "İtalyan dana ve buzağı derisi. Tokalar fırçalı pirinç veya sade metal; kayış kenarları el bitişli, kalınlık günlük kullanıma uygun tutulur.";
    case "Çanta":
      return "Yumuşak grenli deri ve süet. İç astar sade pamuk karışımıdır; fermuar ve mıknatıs donanımlar sessiz çalışacak şekilde seçilir.";
    case "Aksesuar":
      return "Fırçalı ve cilalı pirinç kaplama metaller. Formlar minimal tutulur; ağırlık gün boyu rahat taşınacak ölçüdedir.";
    default:
      return "Lucien Perrin parçaları seçilmiş hammaddeler ve ölçülü işçilikle üretilir. Her materyal, siluetin sakin duruşunu bozmayacak şekilde seçilir.";
  }
}

function getCareCopy(category: string): string {
  switch (category) {
    case "T-Shirt":
      return "30 derecede ters yüz ederek yıkayın. Ağartıcı kullanmayın, düşük ısıda ütüleyin. Örme parçaları asarak değil, sererek kurutun.";
    case "Pantolon":
      return "Kuru temizleme veya hassas program önerilir. Askıda bekletin, kırışmayı azaltmak için buhar kullanın. Saten ve krep yüzeyleri doğrudan ütülemeyin.";
    case "Parfüm":
      return "Işık ve ısıdan uzak, dik konumda saklayın. Sprey mekanizmasını zorlamayın. Cilde uyguladıktan sonra ovalamayın; notaların açılması için zaman tanıyın.";
    case "Kemer":
      return "Kuru bir bezle silin. Deriyi uzun süre nemde bırakmayın. Kullanılmadığında katlamadan, düz veya rulo halinde saklayın.";
    case "Çanta":
      return "Nemli bir bezle silin, süet yüzeylerde özel fırça kullanın. Dolgun durması için içini yumuşak kâğıtla destekleyerek saklayın.";
    case "Aksesuar":
      return "Parfüm ve nemden uzak tutun. Yumuşak bir bezle silin. Uzun süre kullanılmayacaksa ayrı bir kesede saklayın.";
    default:
      return "Ürünü nem ve doğrudan ısıdan uzak tutun. Bakım etiketindeki yönergeleri izleyin; şüphede profesyonel bakım tercih edin.";
  }
}
