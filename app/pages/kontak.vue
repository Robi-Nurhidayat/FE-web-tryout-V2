<script setup>
definePageMeta({ layout: 'landing' })

useSeoMeta({
  title: 'Kontak Nyoba ASN',
  description: 'Hubungi customer service Nyoba ASN untuk bantuan pembelian paket tryout dan akses akun.'
})
</script>

<template>
  <main class="bg-slate-950 text-slate-200 px-6 lg:px-8 py-24">
    <section class="max-w-4xl mx-auto">
      <p class="text-emerald-400 font-bold mb-3">Kontak Kami</p>
      <h1 class="text-4xl lg:text-5xl font-black text-white mb-6">Butuh Bantuan?</h1>

      <p class="text-slate-300 leading-8 mb-10">
        Jika Anda mengalami kendala saat registrasi, login, pembayaran, atau akses paket setelah transaksi berhasil, silakan hubungi customer service Nyoba ASN.
      </p>

      <div class="grid md:grid-cols-2 gap-6">
        <div class="bg-slate-900 border border-slate-800 rounded-3xl p-7">
          <h2 class="text-xl font-bold text-white mb-4">Customer Service</h2>
          <ul class="space-y-3 text-slate-300">
            <!-- <li>WhatsApp: <span class="font-semibold text-white">085793387662</span></li> -->
            <li>Email: <span class="font-semibold text-white">nyobaasn.cs@gmail.com</span></li>
            <li>Jam layanan: <span class="font-semibold text-white">08.00 - 20.00 WIB</span></li>
          </ul>

          <!-- <a
            href="https://wa.me/6285793387662"
            target="_blank"
            rel="noopener"
            class="inline-block mt-6 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition"
          >
            Chat WhatsApp
          </a> -->
        </div>

        <!-- <div class="bg-slate-900 border border-slate-800 rounded-3xl p-7">
          <h2 class="text-xl font-bold text-white mb-4">Alamat Usaha</h2>
          <p class="text-slate-300 leading-8">
            Kp. Cap Jaya RT 007/003, Lenggahsari, Kec. Cabangbungin, Kab. Bekasi, Jawa Barat.
          </p>

          <p class="mt-5 text-sm text-slate-500 leading-7">
            Mohon sertakan Order ID saat menghubungi kami terkait kendala pembayaran atau akses paket.
          </p>
        </div> -->
      </div>
    </section>
  </main>
</template>