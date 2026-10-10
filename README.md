# Notion-Driven Thought Map

Notion'daki Second Brain kayıtlarını sunucuda normalize edilmiş, güvenli bir public graph DTO'suna dönüştürüp Sigma.js ile keşfedilebilir bir düşünce haritası olarak sunan Next.js uygulaması.

## Mimari

Canonical yapı:

`İlgi Alanları → Konular → Metodolojiler → Projeler`

Buna ek olarak ayrı **Metodoloji İlişkileri** veri kaynağı, yönlü `Metodoloji → Metodoloji` bağları üretir. Uygulama yalnız en yakın anlamlı katmanlar arasında şu edge'leri kurar:

- İlgi Alanı → Konu
- Konu → Metodoloji
- Konu → Proje
- Metodoloji → Proje
- Metodoloji → Metodoloji (`Besler`, `Kapsar`, `Tamamlar`, `Derinleştirir`)
- Konu ↔ Konu (`İlgili Konular`)
- Proje ↔ Proje (`İlgili Projeler`)

Konu ve proje içi bağlar yönsüzdür; tek uçta veya iki uçta kayıtlı aynı ilişki tek bağlantı üretir. Kendine, yanlış katmana, eksik ya da gizli kayda giden bağlar atlanır. Seçim ve kategori filtreleri bu bağları da doğrudan komşuluk olarak gösterir; Notion'da bulunmayan bağlantılar türetilmez.

Veri akışı: `Notion → server-only fetcher'lar → normalize edilmiş tipler → gizlilik/arşiv filtresi → public graph DTO → Graphology → çember yerleşimi → Sigma.js`.

Toplu görünümde ilgi alanları, konular, metodolojiler ve projeler merkezden dışarıya dört çemberde yerleşir. Kategori filtresinde seçilen katman tek çember oluşturur. Yerleşim bağlantıları değiştirmez; bağlı noktaları yakın açılara taşır ve dar ekranlarda nokta boyutlarını boşluğa göre sınırlar.

Graph'ta dört node tipi bulunur: **İlgi Alanı**, **Konu**, **Metodoloji** ve **Proje**. Boyutlar önem puanına göre değil node tipine göre belirlenir. Notion'daki `Ad` başlık, `Özet` ise canonical public açıklamadır.

## Public-by-default ve arşiv kuralları

Tüm kayıtlar, **Projeler dahil**, varsayılan olarak public'tir. İsteğe bağlı `Gizli` checkbox'ı varsa ve `true` ise kayıt public graph'a, client props'a veya aramaya aktarılmaz. `Gizli` yoksa ya da `false` ise kayıt public'tir.

`Aşama = Arşiv` olan metodolojiler aktif haritadan çıkarılır. Bu bir yaşam döngüsü kuralıdır; gizlilik anlamına gelmez. Elenen düğümlere bağlı edge'ler de graph builder tarafından kaldırılır.

## Yerelde çalıştırma

```bash
cp .env.example .env.local
npm ci
npm run dev
```

Varsayılan `GRAPH_SOURCE=mock` ile Notion erişimi olmadan çalışır. Mock veri dört node tipini, proje bağlantılarını ve semantic metodoloji ilişkisini içerir.

## Ortam değişkenleri

| Değişken | Açıklama |
| --- | --- |
| `GRAPH_SOURCE` | `mock` (varsayılan) veya `notion` |
| `NOTION_TOKEN` | Server-only integration token |
| `NOTION_INTEREST_AREAS_DATA_SOURCE_ID` | İlgi Alanları veri kaynağı ID'si |
| `NOTION_TOPICS_DATA_SOURCE_ID` | Konular veri kaynağı ID'si |
| `NOTION_METHODOLOGIES_DATA_SOURCE_ID` | Metodolojiler veri kaynağı ID'si |
| `NOTION_PROJECTS_DATA_SOURCE_ID` | Projeler veri kaynağı ID'si |
| `NOTION_METHODOLOGY_RELATIONSHIPS_DATA_SOURCE_ID` | Metodoloji İlişkileri veri kaynağı ID'si |
| `CRON_SECRET` | Revalidation endpoint bearer secret |

ID değerleri düz UUID veya `collection://...` biçiminde verilebilir. Hiçbir değişken `NEXT_PUBLIC_` değildir. Integration'a beş veri kaynağı için yalnız okuma yetkisi verin.

Eski `NOTION_TOPICS_DATABASE_ID` ve `NOTION_KNOWLEDGE_DATABASE_ID` artık kullanılmaz ve deployment ortamından kaldırılabilir.

## Notion şeması

- **İlgi Alanları:** `Ad`, `Özet`, `Konular`, opsiyonel `Gizli`
- **Konular:** `Ad`, `Özet`, `İlgi Alanları`, `Metodolojiler`, `Projeler`, opsiyonel `İlgili Konular` (aynı veri kaynağına relation), opsiyonel `Gizli`
- **Metodolojiler:** `Ad`, `Özet`, `Aşama`, `Konular`, `Projeler`, `Kaynak / Köken`, opsiyonel `Gizli`
- **Projeler:** `Ad`, `Özet`, `Tür`, `Durum`, `Konular`, `Metodolojiler`, opsiyonel `İlgili Projeler` (aynı veri kaynağına relation), opsiyonel `Gizli`
- **Metodoloji İlişkileri:** `Kaynak Metodoloji`, `Hedef Metodoloji`, `İlişki Türü`, `Açıklama`

Eksik opsiyonel property'ler güvenli varsayılanlara (`false`, `[]`, `""`) normalize edilir. Tanınmayan ilişki türleri ve bozuk satırlar sunucu tanı kaydıyla atlanır.

## Cache ve revalidation

Graph verisi Next.js cache içinde 24 saat tutulur. Korumalı endpoint platformdan bağımsız bir cron ile çağrılabilir:

```bash
curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://thoughtmap.example.com/api/revalidate-graph
```

`/api/revalidate-graph`, doğru `CRON_SECRET` olmadan `401` döndürür. Uygulama responsive container ölçülerini izler ve iframe içinde çalışır.
