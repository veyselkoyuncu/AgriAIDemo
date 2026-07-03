import Link from "next/link";
import { Shield, Lock, Eye, FileText, ArrowLeft, Sprout } from "lucide-react";

export const metadata = {
  title: "Gizlilik Politikası | AgriAI Demo",
  description: "AgriAI Demo projesinin kişisel veri koruma, WhatsApp mesaj işleme ve Gemini AI entegrasyonu gizlilik politikası.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-zinc-50 to-green-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-emerald-950/20 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-3xl border border-emerald-100/50 bg-white/80 p-8 shadow-xl backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/80 sm:p-12">
        
        {/* Back Button & Logo */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200/50 pb-6 dark:border-zinc-800/50">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white/50 px-4 py-2 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Ana Sayfaya Dön
          </Link>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 shadow-md shadow-emerald-600/20">
              <Sprout className="h-4 w-4 text-white" />
            </span>
            <span className="text-md font-bold tracking-tight text-zinc-900 dark:text-white">
              AgriAI <span className="text-emerald-500">Demo</span>
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="mt-8 text-center sm:text-left">
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
            Gizlilik Politikası
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Son Güncelleme: 3 Temmuz 2026
          </p>
        </div>

        {/* Highlight Cards */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-zinc-100 bg-zinc-50/50 p-5 dark:border-zinc-800/60 dark:bg-zinc-950/20">
            <Shield className="h-6 w-6 text-emerald-600" />
            <h3 className="mt-3 font-bold text-zinc-900 dark:text-zinc-50">Güvenli Depolama</h3>
            <p className="mt-1 text-xs text-zinc-500 leading-relaxed">
              Verileriniz Supabase PostgreSQL altyapısında şifrelenmiş olarak ve RLS politikalarıyla korunarak saklanır.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-100 bg-zinc-50/50 p-5 dark:border-zinc-800/60 dark:bg-zinc-950/20">
            <Lock className="h-6 w-6 text-teal-600" />
            <h3 className="mt-3 font-bold text-zinc-900 dark:text-zinc-50">Yapay Zeka Gizliliği</h3>
            <p className="mt-1 text-xs text-zinc-500 leading-relaxed">
              WhatsApp üzerinden gönderdiğiniz ses kayıtları ve mesajlar sadece tarımsal analiz amacıyla Gemini API'ye iletilir, model eğitimi için kullanılmaz.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-100 bg-zinc-50/50 p-5 dark:border-zinc-800/60 dark:bg-zinc-950/20">
            <Eye className="h-6 w-6 text-amber-600" />
            <h3 className="mt-3 font-bold text-zinc-900 dark:text-zinc-50">Şeffaflık</h3>
            <p className="mt-1 text-xs text-zinc-500 leading-relaxed">
              Hangi verilerinizin toplandığını, nasıl işlendiğini ve ne zaman silineceğini tamamen kontrol edebilirsiniz.
            </p>
          </div>
        </div>

        {/* Policy Content */}
        <div className="mt-10 space-y-8 text-zinc-700 dark:text-zinc-300">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600" />
              1. Toplanan Veriler
            </h2>
            <p className="text-sm leading-relaxed">
              AgriAI Demo projesi kapsamında platformu kullanabilmeniz ve WhatsApp asistanımızla etkileşime geçebilmeniz amacıyla aşağıdaki kişisel verileriniz toplanmaktadır:
            </p>
            <ul className="list-disc pl-5 text-sm space-y-1">
              <li><strong>Hesap Bilgileri:</strong> Kayıt sırasında paylaştığınız ad, soyad ve e-posta adresi.</li>
              <li><strong>İletişim Bilgileri:</strong> WhatsApp üzerinden gelen mesajları profilinizle eşleştirmek amacıyla kullanılan WhatsApp telefon numaranız.</li>
              <li><strong>Tarım Verileri:</strong> Web paneli üzerinden tanımladığınız tarlalar, ekili ürünler ve ekim tarihleri.</li>
              <li><strong>Mesajlaşma Logları:</strong> WhatsApp asistanımıza gönderdiğiniz yazılı mesajlar ile ses kayıtları (ses kayıtları metne dönüştürülerek faaliyet tespiti için işlenir).</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600" />
              2. Verilerin İşlenme Amaçları
            </h2>
            <p className="text-sm leading-relaxed">
              Toplanan kişisel ve tarımsal verileriniz sadece aşağıdaki amaçlar doğrultusunda işlenmektedir:
            </p>
            <ul className="list-disc pl-5 text-sm space-y-1">
              <li>WhatsApp üzerinden gönderdiğiniz sesli ve yazılı mesajların Google Gemini AI motoru yardımıyla taranarak faaliyet günlüğü (gübreleme, sulama, ilaçlama vb.) olarak veritabanınıza kaydedilmesi.</li>
              <li>Yapay zeka asistanının geçmiş faaliyet verilerinizi inceleyerek tarımsal faaliyetleriniz hakkında size kişiselleştirilmiş geri bildirim ve danışmanlık vermesi.</li>
              <li>Çiftçi arayüzünde (Dashboard) tarlalarınızın, ürünlerinizin ve geçmiş faaliyet zaman çizelgenizin görselleştirilmesi.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600" />
              3. Verilerin Üçüncü Taraflarla Paylaşımı
            </h2>
            <p className="text-sm leading-relaxed">
              Verileriniz hiçbir şekilde ticari amaçlarla üçüncü şahıslara satılmaz veya kiralanmaz. Ancak, sistemin işleyişi adına aşağıdaki servis sağlayıcıları ile entegrasyonlar kurulmuştur:
            </p>
            <ul className="list-disc pl-5 text-sm space-y-1">
              <li><strong>Supabase:</strong> Kullanıcı kimlik doğrulama, profil verileri ve tarımsal logların güvenli şekilde saklanması amacıyla.</li>
              <li><strong>Google Gemini API:</strong> Gönderilen tarımsal mesajların ve ses kayıtlarının çözümlenip niyet analizinin (intent) çıkarılması amacıyla.</li>
              <li><strong>Meta WhatsApp Cloud API:</strong> Çiftçi ile WhatsApp asistanı arasındaki çift yönlü mesaj iletiminin gerçekleştirilmesi amacıyla.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600" />
              4. Veri Güvenliği ve Saklama Süresi
            </h2>
            <p className="text-sm leading-relaxed">
              Kişisel verileriniz, Supabase PostgreSQL veri tabanında Row Level Security (RLS) kısıtlamaları altında, sadece yetkili kullanıcıların erişebileceği şekilde saklanır. Hesabınızı kapatmak veya tüm verilerinizin silinmesini talep etmek isterseniz, verileriniz tüm sistemlerden kalıcı olarak silinecektir.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600" />
              5. İletişim ve Destek
            </h2>
            <p className="text-sm leading-relaxed">
              Gizlilik politikamız veya verilerinizin işlenmesiyle ilgili herhangi bir soru, görüş veya veri silme talebiniz için bizimle iletişime geçebilirsiniz:
            </p>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-5 dark:border-zinc-800 dark:bg-zinc-950/20 text-sm">
              <p><strong>E-posta:</strong> destek@agriai.com</p>
              <p className="mt-1"><strong>Proje Türü:</strong> MVP / Demo Çalışması</p>
            </div>
          </section>
        </div>
        
        {/* Footer */}
        <div className="mt-12 border-t border-zinc-200/50 pt-6 text-center text-xs text-zinc-500 dark:border-zinc-800/50 dark:text-zinc-600">
          &copy; {new Date().getFullYear()} AgriAI Demo. Tüm hakları saklıdır.
        </div>

      </div>
    </div>
  );
}
