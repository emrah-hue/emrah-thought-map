import type { SourceNode } from "./types";
const topic=(id:string,label:string,subtype:string,summary:string,weight=3):SourceNode=>({id,label,nodeClass:"topic",subtype,summary,weight});
const knowledge=(id:string,label:string,subtype:string,stage:string,summary:string,weight:number,topicIds:string[],relatedIds:string[]):SourceNode=>({id,label,nodeClass:"knowledge",subtype,stage,summary,weight,topicIds,relatedIds});
export const mockSource:SourceNode[]=[
 topic("t-system","Sistem Düşüncesi","Bakış Açısı","Parçaları tek başına değil, aralarındaki ilişkiler ve geri bildirim döngüleriyle birlikte okuma disiplini.",5),
 topic("t-leadership","Liderlik","Yetkinlik","Belirsizlik içinde yön, anlam ve hareket üreten kolektif kapasite.",4),
 topic("t-safety","Psikolojik Güvenlik","Alan","İnsanların soru sorabildiği, hata ve farklı görüşleri risk almadan görünür kılabildiği ortam.",4),
 topic("t-learning","Öğrenme","Alan","Bilginin davranışa, deneyime ve sürdürülebilir kapasiteye dönüşmesi.",5),
 topic("t-purpose","Amaç","Alan","Kararları ve ortak hareketi anlamlı bir yöne bağlayan temel niyet.",4),
 topic("t-maturity","Olgunluk","Bakış Açısı","Bir sistemin karmaşıklığı taşıma, öğrenme ve tutarlı değer üretme kapasitesi.",4),
 topic("t-pattern","Örüntü Zekâsı","İmza Çerçevesi","Tekrarlayan dinamikleri fark etme ve yüzeydeki olayların altındaki yapıyı okuyabilme yetisi.",5),
 knowledge("k-vmodel","V Modeli","Çerçeve","Yerleşik","Organizasyonel hareketi amaçtan davranışa inen ve deneyimden öğrenmeye geri çıkan iki yönlü bir akış olarak ele alır.",5,["t-system","t-purpose","t-learning"],["k-vlearning","k-alignment","k-maturity"]),
 knowledge("k-vlearning","V Öğrenme Modeli","Model","Uygulamada","Öğrenme ihtiyacından sahadaki davranış değişikliğine ve yeniden anlamlandırmaya uzanan transfer modeli.",4,["t-learning","t-system"],["k-vmodel","k-root"]),
 knowledge("k-alignment","Stratejiden Davranışa Hizalanma","Metodoloji","Deneniyor","Soyut stratejik tercihleri gözlenebilir gündelik davranışlara ve karar ilkelerine bağlayan çalışma biçimi.",4,["t-purpose","t-leadership"],["k-vmodel","k-root"]),
 knowledge("k-maturity","Organizasyonel Olgunluk","Kavram","Geliştiriliyor","Olgunluğu büyüklükten ayırır; sistemin gerilimleri taşıma ve onlardan öğrenme kapasitesine odaklanır.",5,["t-maturity","t-system","t-leadership"],["k-growth","k-vmodel"]),
 knowledge("k-growth","Büyümek Olgunluk Değildir","İlke","Yerleşik","Ölçek artışının tek başına daha sağlıklı karar, ilişki veya öğrenme kapasitesi yaratmadığını hatırlatır.",3,["t-maturity"],["k-maturity"]),
 knowledge("k-root","4 Katmanlı Kök Neden Teşhis Motoru","Metodoloji","Uygulamada","Bir sorunu belirti, davranış, yapı ve zihinsel model katmanlarında inceleyerek müdahale alanını netleştirir.",4,["t-pattern","t-system","t-safety"],["k-vlearning","k-alignment"]),
];
