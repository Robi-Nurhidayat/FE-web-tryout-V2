<template>
  <footer class="bg-slate-950 border-t border-slate-800 text-slate-300">
    <div class="max-w-7xl mx-auto px-6 lg:px-8 py-12">
      <div class="grid gap-10 md:grid-cols-4">
        <div class="md:col-span-2">
          <NuxtLink to="/" class="inline-flex items-center gap-2 text-2xl font-black text-white">
            Nyoba<span class="text-emerald-400">ASN</span>
          </NuxtLink>

          <p class="mt-4 max-w-xl text-sm leading-7 text-slate-400">
            Nyoba ASN adalah platform latihan tryout online untuk membantu peserta mempersiapkan diri menghadapi seleksi CASN, CPNS, dan PPPK melalui paket soal, sistem CAT, pembahasan, serta evaluasi hasil.
          </p>

          <div class="mt-5 text-sm text-slate-400 space-y-1">
            <!-- <p>Nama Usaha: <span class="text-slate-200 font-semibold">Nyoba ASN</span></p>
            <p>Pemilik: <span class="text-slate-200 font-semibold">Robi Nurhidayat</span></p> -->
            <p>Email: <span class="text-slate-200 font-semibold">nyobaasn.cs@gmail.com</span></p>
            <!-- <p>WhatsApp/CS: <span class="text-slate-200 font-semibold">085793387662</span></p> -->
          </div>
        </div>

        <div>
          <h3 class="font-bold text-white mb-4">Navigasi</h3>
          <ul class="space-y-3 text-sm">
            <li><NuxtLink to="/" class="hover:text-emerald-400">Beranda</NuxtLink></li>
            <li><NuxtLink to="/paket" class="hover:text-emerald-400">Paket Ujian</NuxtLink></li>
            <li><NuxtLink to="/tentang" class="hover:text-emerald-400">Tentang Kami</NuxtLink></li>
            <li><NuxtLink to="/kontak" class="hover:text-emerald-400">Kontak Kami</NuxtLink></li>
          </ul>
        </div>

        <div>
          <h3 class="font-bold text-white mb-4">Informasi</h3>
          <ul class="space-y-3 text-sm">
            <li><NuxtLink to="/syarat-ketentuan" class="hover:text-emerald-400">Syarat & Ketentuan</NuxtLink></li>
            <li><NuxtLink to="/kebijakan-privasi" class="hover:text-emerald-400">Kebijakan Privasi</NuxtLink></li>
            <!-- <li><NuxtLink to="/kebijakan-refund" class="hover:text-emerald-400">Kebijakan Refund</NuxtLink></li> -->
          </ul>
        </div>
      </div>

      <div class="mt-10 pt-6 border-t border-slate-800 flex flex-col md:flex-row justify-between gap-3 text-xs text-slate-500">
        <p>© {{ new Date().getFullYear() }} Nyoba ASN. Seluruh hak cipta dilindungi.</p>
        <!-- <p>Platform latihan mandiri. Tidak berafiliasi dengan BKN, SSCASN, atau instansi pemerintah.</p> -->
      </div>
    </div>
  </footer>
</template>