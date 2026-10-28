<script setup>
definePageMeta({ layout: 'landing' })

useSeoMeta({
  title: 'Tentang Nyoba ASN',
  description: 'Informasi tentang Nyoba ASN sebagai platform latihan tryout online CPNS dan PPPK.'
})
</script>

<template>
  <main class="bg-slate-950 text-slate-200 px-6 lg:px-8 py-24">
    <section class="max-w-4xl mx-auto">
      <p class="text-emerald-400 font-bold mb-3">Tentang Kami</p>
      <h1 class="text-4xl lg:text-5xl font-black text-white mb-6">Nyoba ASN</h1>

      <div class="space-y-5 text-slate-300 leading-8">
        <p>
          Nyoba ASN adalah platform latihan tryout online yang menyediakan paket soal untuk membantu peserta mempersiapkan diri menghadapi seleksi CASN, CPNS, dan PPPK.
        </p>

        <p>
          Layanan yang tersedia berupa produk digital dalam bentuk akses latihan soal, sistem pengerjaan berbasis CAT, pembahasan soal, evaluasi hasil, dan ranking sesuai paket yang tersedia.
        </p>

        <!-- <p>
          Nyoba ASN dikelola oleh Robi Nurhidayat. Platform ini dibuat sebagai sarana latihan mandiri dan tidak berafiliasi dengan BKN, SSCASN, maupun instansi pemerintah.
        </p> -->
      </div>

      <div class="mt-10 grid md:grid-cols-2 gap-5">
        <!-- <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 class="font-bold text-white mb-3">Informasi Usaha</h2>
          <ul class="space-y-2 text-sm text-slate-400">
            <li>Nama Usaha: <span class="text-slate-200">Nyoba ASN</span></li>
            <li>Pemilik: <span class="text-slate-200">Robi Nurhidayat</span></li>
            <li>Email: <span class="text-slate-200">robinurhidayat29081999@gmail.com</span></li>
            <li>CS: <span class="text-slate-200">085793387662</span></li>
          </ul>
        </div> -->

        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 class="font-bold text-white mb-3">Jenis Produk</h2>
          <p class="text-sm text-slate-400 leading-7">
            Produk yang dijual adalah paket tryout online berbentuk akses digital. Harga paket ditampilkan dalam Rupiah pada halaman Paket Ujian.
          </p>
        </div>
      </div>
    </section>
  </main>
</template>