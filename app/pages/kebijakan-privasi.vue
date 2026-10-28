<script setup>
definePageMeta({ layout: 'landing' })

useSeoMeta({
  title: 'Kebijakan Privasi - Nyoba ASN',
  description: 'Kebijakan privasi dan penggunaan data pengguna Nyoba ASN.'
})
</script>

<template>
  <main class="bg-slate-950 text-slate-200 px-6 lg:px-8 py-24">
    <section class="max-w-4xl mx-auto">
      <p class="text-emerald-400 font-bold mb-3">Privasi Pengguna</p>
      <h1 class="text-4xl lg:text-5xl font-black text-white mb-8">Kebijakan Privasi</h1>

      <div class="space-y-8 text-slate-300 leading-8">
        <div>
          <h2 class="text-xl font-bold text-white mb-3">1. Data yang Kami Kumpulkan</h2>
          <p>
            Kami dapat mengumpulkan data seperti nama, email, informasi akun, riwayat transaksi, paket yang dibeli, jawaban tryout, skor, dan data teknis yang diperlukan untuk menjalankan layanan.
          </p>
        </div>

        <div>
          <h2 class="text-xl font-bold text-white mb-3">2. Penggunaan Data</h2>
          <p>
            Data digunakan untuk membuat akun, memproses pembelian, mengaktifkan paket, menampilkan hasil tryout, menyediakan pembahasan, dan membantu layanan pelanggan.
          </p>
        </div>

        <div>
          <h2 class="text-xl font-bold text-white mb-3">3. Pembayaran</h2>
          <p>
            Proses pembayaran dilakukan melalui payment gateway. Nyoba ASN tidak menyimpan data sensitif kartu pembayaran pengguna.
          </p>
        </div>

        <div>
          <h2 class="text-xl font-bold text-white mb-3">4. Keamanan Data</h2>
          <p>
            Kami berupaya menjaga keamanan data pengguna dengan mekanisme autentikasi dan pembatasan akses. Namun, pengguna juga wajib menjaga keamanan akun dan tidak membagikan akses login kepada pihak lain.
          </p>
        </div>

        <div>
          <h2 class="text-xl font-bold text-white mb-3">5. Kontak</h2>
          <p>
            Untuk pertanyaan terkait privasi atau penghapusan akun, pengguna dapat menghubungi kami melalui email nyobaasn.cs@gmail.com
          </p>
        </div>
      </div>
    </section>
  </main>
</template>