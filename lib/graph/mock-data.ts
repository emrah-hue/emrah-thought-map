import type { NormalizedSecondBrain } from "./types";

export const mockSource: NormalizedSecondBrain = {
  interestAreas: [
    { id: "ia-org", title: "Organizasyon", summary: "Organizasyonları canlı ilişkiler ve karar sistemleri olarak ele alan çalışma alanı.", topicIds: ["t-system", "t-leadership"] },
    { id: "ia-learning", title: "Öğrenme ve Gelişim", summary: "Deneyimin kalıcı kapasiteye nasıl dönüştüğünü araştıran çalışma alanı.", topicIds: ["t-learning", "t-safety"] },
  ],
  topics: [
    { id: "t-system", title: "Sistem Düşüncesi", summary: "Parçaları ilişkiler ve geri bildirim döngüleriyle birlikte okuma disiplini.", interestAreaIds: ["ia-org"], methodologyIds: ["m-vmodel", "m-root"], projectIds: ["p-map"] },
    { id: "t-leadership", title: "Liderlik", summary: "Belirsizlik içinde yön, anlam ve hareket üreten kolektif kapasite.", interestAreaIds: ["ia-org"], methodologyIds: ["m-alignment"], projectIds: ["p-program"] },
    { id: "t-learning", title: "Öğrenme", summary: "Bilginin davranışa, deneyime ve sürdürülebilir kapasiteye dönüşmesi.", interestAreaIds: ["ia-learning"], methodologyIds: ["m-vmodel"], projectIds: ["p-program"] },
    { id: "t-safety", title: "Psikolojik Güvenlik", summary: "İnsanların soru ve farklı görüşleri risk almadan görünür kılabildiği ortam.", interestAreaIds: ["ia-learning"], methodologyIds: ["m-root"], projectIds: [] },
  ],
  methodologies: [
    { id: "m-vmodel", title: "V Modeli", summary: "Organizasyonel hareketi amaçtan davranışa ve deneyimden öğrenmeye uzanan akış olarak ele alır.", stage: "Yerleşik", topicIds: ["t-system", "t-learning"], projectIds: ["p-map"], source: "Saha çalışmaları" },
    { id: "m-root", title: "4 Katmanlı Kök Neden Teşhisi", summary: "Sorunları belirti, davranış, yapı ve zihinsel model katmanlarında inceler.", stage: "Uygulamada", topicIds: ["t-system", "t-safety"], projectIds: ["p-program"] },
    { id: "m-alignment", title: "Stratejiden Davranışa Hizalanma", summary: "Stratejik tercihleri gündelik davranışlara ve karar ilkelerine bağlar.", stage: "Deneniyor", topicIds: ["t-leadership"], projectIds: ["p-program"] },
  ],
  projects: [
    { id: "p-map", title: "Thought Map", summary: "İlgi alanları, konular ve metodolojiler arasındaki bağı görünür kılan dijital harita.", type: "Ürün", status: "Aktif", topicIds: ["t-system"], methodologyIds: ["m-vmodel"] },
    { id: "p-program", title: "Liderlik Programı", summary: "Liderlik pratiklerini gerçek iş bağlamında geliştiren öğrenme programı.", type: "Program", status: "Geliştiriliyor", topicIds: ["t-leadership", "t-learning"], methodologyIds: ["m-root", "m-alignment"] },
    { id: "p-book", title: "Olgun Organizasyonlar", summary: "Organizasyonel olgunluk üzerine gelişmekte olan kitap çalışması.", type: "Kitap", status: "Taslak", topicIds: ["t-system"], methodologyIds: [] },
  ],
  methodologyRelationships: [
    { id: "r-vmodel-root", sourceMethodologyId: "m-vmodel", targetMethodologyId: "m-root", relationType: "Derinleştirir", description: "Kök neden teşhisi, V Modeli içindeki öğrenme döngüsünü derinleştirir." },
  ],
};
