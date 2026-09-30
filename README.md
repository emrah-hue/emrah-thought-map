# Notion-Driven Thought Map

Notion'daki **Konular** ve **Bilgi Ağı** veritabanlarını, sunucuda güvenli bir public DTO'ya dönüştürüp Sigma.js ile keşfedilebilir bir ağa çeviren bağımsız Next.js uygulaması.

## Mimari

`Notion → server-only adapter → public güvenlik filtresi → graph DTO → Graphology → ForceAtlas2 → Sigma.js`

- Notion sorgusu daha kaynaktayken yalnız `Görünürlük = Kamusal` kayıtları ister; graph builder ikinci bir allow-list kontrolü yapar.
- `Projeler` alanı okunmaz ve DTO'ya taşınmaz. Private/arşiv node'lar ile bunlara giden edge'ler builder'da elenir.
- Graph verisi Next.js cache içinde 24 saat tutulur. Korumalı endpoint bağımsız cron servislerinden çağrılabilir.
- Renderer yalnız normalize edilmiş `PublicGraph` tipini bilir; Notion property yapısını bilmez.

## Yerelde çalıştırma

```bash
cp .env.example .env.local
npm install
npm run dev
```

Varsayılan `GRAPH_SOURCE=mock` ile Notion erişimi olmadan çalışır. Üretim kontrolü: `npm run test && npm run typecheck && npm run build`.

## Ortam değişkenleri

| Değişken | Açıklama |
| --- | --- |
| `GRAPH_SOURCE` | `mock` veya `notion` |
| `NOTION_TOKEN` | Server-only integration token |
| `NOTION_TOPICS_DATABASE_ID` | Konular database ID |
| `NOTION_KNOWLEDGE_DATABASE_ID` | Bilgi Ağı database ID |
| `CRON_SECRET` | Revalidation endpoint bearer secret |

Hiçbir değişken `NEXT_PUBLIC_` değildir. Notion integration'ına iki database için yalnız okuma yetkisi verin.

## Beklenen Notion şeması

Property adları ve tipleri birebir şöyledir:

**Konular:** `Ad` (title), `Özet` (rich text), `Konu Türü` (select), `Görünürlük` (select), `Ağırlık` (number, opsiyonel).

**Bilgi Ağı:** `Ad` (title), `Özet` (rich text), `Tür` (select), `Aşama` (select/status), `Görünürlük` (select), `Ağırlık` (number, opsiyonel), `Konular` (relation), `İlişkili Kayıtlar` (relation).

Kamusal select değeri tam olarak `Kamusal`; arşiv aşaması tam olarak `Arşiv` olmalıdır. Relation property'lerinin integration tarafından okunabildiğini doğrulayın.

## Preview ve Vercel deploy

Notion bağlantısını açmadan production görünümünü yerelde incelemek için:

```bash
npm install
npm run preview
```

Preview, uygulamayı `GRAPH_SOURCE=mock` ile production modunda derler ve tüm ağ arayüzlerinden `http://localhost:3000` adresinde sunar. Uzak bir geliştirme ortamında port `3000` için ortamın **Ports / Forwarded ports** ekranından geçici public URL oluşturabilirsiniz.

Kalıcı olmayan bir Vercel Preview URL almak için en kısa akış:

1. Bu repository'nin `main` branch'ini GitHub, GitLab veya Bitbucket'a push edin.
2. Vercel'de **Add New → Project** ile repository'yi import edin; framework ayarı otomatik olarak **Next.js** seçilir.
3. Environment Variables bölümünde Preview, Development ve Production için `GRAPH_SOURCE=mock` ekleyin. Şimdilik Notion değişkenlerini eklemeyin.
4. **Deploy** seçeneğine basın. İlk deployment bir URL üretir; sonraki pull request'ler bağımsız Preview URL'leri alır.

Vercel hesabı önceden doğrulanmışsa aynı işlem CLI ile repository kökünden de başlatılabilir:

```bash
npx vercel --yes --env GRAPH_SOURCE=mock
```

Komutun döndürdüğü `https://…vercel.app` adresi deployment preview'ıdır. Production'a yükseltmek istediğinizde ayrıca `npx vercel --prod --yes --env GRAPH_SOURCE=mock` çalıştırın.

Notion senkronizasyonuna daha sonra geçildiğinde gerekli server-only değişkenlerini Vercel'e ekleyin ve günlük olarak aşağıdaki isteği çalıştırın:

```bash
curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://thoughtmap.example.com/api/revalidate-graph
```

Uygulama responsive container ölçülerini izler ve iframe içinde çalışır. Sunucu `frame-ancestors *` gönderir; üretimde bunu izin verilen parent domain'lerle daraltmanız önerilir.

## MVP kapsamı

Kaynak DTO tipi ve panel bölümü ileri kullanım için hazırdır; Notion kaynak database adaptörü, doküman görüntüleyici, semantic search, AI/RAG, kullanıcı hesabı ve write-back bilinçli olarak kapsam dışıdır.
