#!/usr/bin/env node
// ดึงภาพธงจากต้นทางที่ตรึงรุ่นไว้และตรวจรหัสไฟล์ ก่อนบันทึกให้เว็บใช้แบบออฟไลน์
// ใช้เฉพาะตอนเตรียมเนื้อหา ไม่ใช่ขั้นตอน build หรือ dependency ของเว็บ
// node scripts/fetch-country-flags.js          ดึงไฟล์ที่ยังไม่มีหรือไม่ตรงต้นทาง
// node scripts/fetch-country-flags.js --check  ตรวจไฟล์เดิมโดยไม่ใช้อินเทอร์เน็ต
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const crypto = require("crypto");
const ROOT = path.join(__dirname, "..");
const FLAG_REVISION = "ac7e0eb3259eb62aa6100c435607e2fe03896a97";
const COUNTRY_REVISION = "fa4f62182d19ff4f8b325cde6387c9cd9d80955a";
const FLAG_SOURCES = {
  "ao": {
    "sha": "b73b1ec5e45073af6e4d854881b9821bf83ffd83",
    "bytes": 1602
  },
  "al": {
    "sha": "e85d95f0f0a67d3d2fdd828c289a1c80210e7022",
    "bytes": 3126
  },
  "ae": {
    "sha": "651ac8523d3d933827ccfbdf5dfd598e65bad442",
    "bytes": 266
  },
  "ar": {
    "sha": "c753da103f3ceae0a975b6eda70c2776f7467c5f",
    "bytes": 3461
  },
  "am": {
    "sha": "99fa4dc5979a45b249ca805c2a43d3a8c74841d2",
    "bytes": 228
  },
  "au": {
    "sha": "96e80768bb7084e490fd34ad626f40d5cea1ac7b",
    "bytes": 1296
  },
  "at": {
    "sha": "9d2775c083280e98bcaa0fc8e136ebaef5984bf8",
    "bytes": 195
  },
  "az": {
    "sha": "35575221104fccb01c19318bdb15b6247a4108d4",
    "bytes": 501
  },
  "bi": {
    "sha": "a4434a955fbcdb15e1b297cc46d884bc85cdec6c",
    "bytes": 1078
  },
  "be": {
    "sha": "ac706a0b5a148cb20a1bdecb79bb709d20455fa3",
    "bytes": 302
  },
  "bj": {
    "sha": "0846724d179abc3f815246236d220f6f43b9bd1a",
    "bytes": 499
  },
  "bf": {
    "sha": "09e53a8d5e83a6004c374f099e552ec938755ff6",
    "bytes": 342
  },
  "bd": {
    "sha": "16b794debd08294403b4e61c61a17ae02bfa0a44",
    "bytes": 187
  },
  "bg": {
    "sha": "af2d0d07c31e24fabc76bc7df026cfa046ac682e",
    "bytes": 225
  },
  "bs": {
    "sha": "5cc918e5ad40ee0af8f8d819ca3666f0e7026530",
    "bytes": 557
  },
  "ba": {
    "sha": "93bd9cf9378475a443d6f29b0708e932a685ae22",
    "bytes": 1240
  },
  "by": {
    "sha": "948784ff17075fee77bd5abd4ae862f7bf9d0026",
    "bytes": 2078
  },
  "bz": {
    "sha": "d81b16c23d446934aa0876086d8b1abeea833f9c",
    "bytes": 42505
  },
  "bo": {
    "sha": "7658e3f6c26dcb342aa0b8dc6664ebab386fb30e",
    "bytes": 102880
  },
  "br": {
    "sha": "719a763caaf7cc2b1809fe05b5f06e5f12e47393",
    "bytes": 7140
  },
  "bn": {
    "sha": "f544c25e22728dc40004e88a009a49b8ab2a5118",
    "bytes": 13340
  },
  "bt": {
    "sha": "20aef3a63b4dcbe769cc63bfc13c152df4102b4d",
    "bytes": 24784
  },
  "bw": {
    "sha": "3435608d6c0daa48ae4a042eee336f58b9886bb9",
    "bytes": 264
  },
  "cf": {
    "sha": "a6cd3670f27279db2138f14ab185f1ac44ed3c64",
    "bytes": 687
  },
  "ca": {
    "sha": "c9b23b4988b326e10be7508e91919fd1d29ec852",
    "bytes": 625
  },
  "ch": {
    "sha": "b42d6709cfaf22e773bc7aa5da7095eff742873e",
    "bytes": 290
  },
  "cl": {
    "sha": "5b3c72fa7c26f80593b0757227deb9c4b77bdf34",
    "bytes": 552
  },
  "cn": {
    "sha": "10d3489a0e60176c4db839ad958facf76717cbd1",
    "bytes": 813
  },
  "ci": {
    "sha": "4eb884d9ce66228fd23dd59ba934fb9331780d6a",
    "bytes": 277
  },
  "cm": {
    "sha": "70adc8b6818f844e2015f0b76953d4519de585fa",
    "bytes": 840
  },
  "cd": {
    "sha": "b9cf528941371b9cc973bdc5de2bb02425fefad1",
    "bytes": 334
  },
  "cg": {
    "sha": "f5a0e42d4595ffca08ac64ab1188221cf01f5ee7",
    "bytes": 470
  },
  "co": {
    "sha": "ebd0a0fb2d4b374a6e3f6722436bd54ea89e0520",
    "bytes": 286
  },
  "cr": {
    "sha": "5a409eebb25d8b72ff39b435bda8c22b6c0115e1",
    "bytes": 290
  },
  "cu": {
    "sha": "053c9ee3a0296e8594867aaea12b229ad609d0ee",
    "bytes": 610
  },
  "cy": {
    "sha": "ee4b0c78c285555b9e011ebb0356956bf10e97c3",
    "bytes": 5466
  },
  "cz": {
    "sha": "7913de3895e8c149a00419187aa0fee16fd0325e",
    "bytes": 225
  },
  "de": {
    "sha": "71aa2d2c30f576d3577b5c93c7cc2cc9de740da7",
    "bytes": 221
  },
  "dj": {
    "sha": "9b00a82056625e86235dc988080d3c142f9dbcca",
    "bytes": 585
  },
  "dk": {
    "sha": "563277f81d904ddf48573466c018c914d693bf6a",
    "bytes": 236
  },
  "do": {
    "sha": "78c2e161edc4aead4d3877fb8d9b9bc69680cab1",
    "bytes": 40266
  },
  "dz": {
    "sha": "5ff29a74a00be5f65b5219b35ca6caaa6399e87f",
    "bytes": 294
  },
  "ec": {
    "sha": "88c50bf616564c5ed2d5d895572d4f54fcc9b29b",
    "bytes": 28777
  },
  "eg": {
    "sha": "909f1e7a8f6543531e4f94cc22197f7ae09e68c7",
    "bytes": 8717
  },
  "er": {
    "sha": "48a13b47fe6ab02a2e21693e8c5b2d2baaa2ce89",
    "bytes": 3158
  },
  "es": {
    "sha": "a296ebf7e186054afaa06f6a27991aa1b569a5a8",
    "bytes": 80958
  },
  "ee": {
    "sha": "8b98c2c429bc94f6adca7aa099a18b8ab1b8fdd3",
    "bytes": 225
  },
  "et": {
    "sha": "518100c1d061e31c32deb67137e175c5552a41c2",
    "bytes": 1119
  },
  "fi": {
    "sha": "470be2d07c9df2cbedfde2f27fa42cb3a59d3657",
    "bytes": 234
  },
  "fj": {
    "sha": "332ae61d0b8a0ed313c3236f07884154f0e58a17",
    "bytes": 24100
  },
  "fr": {
    "sha": "e682b90020218ddd39df6f81497f14b04bdacbda",
    "bytes": 241
  },
  "ga": {
    "sha": "76edab429c29ee1818c8451da065df5cdd822cb1",
    "bytes": 271
  },
  "gb": {
    "sha": "799138319d8446a6407a3448185559f20b9e3415",
    "bytes": 504
  },
  "ge": {
    "sha": "ab08a9ab4234ea1fb156a10c495984d4d5022ae2",
    "bytes": 1313
  },
  "gh": {
    "sha": "5c3e3e69abef991bccb41ccb60a9e1a3023dc574",
    "bytes": 293
  },
  "gn": {
    "sha": "40d6ad4f03dbd66bd713bad8595fb88dc0d55d73",
    "bytes": 292
  },
  "gm": {
    "sha": "8fe9d669204c288298d69d08ab52e3739632fbeb",
    "bytes": 543
  },
  "gw": {
    "sha": "d470bac9f71b82867e76cdb528c0c2808307df94",
    "bytes": 846
  },
  "gq": {
    "sha": "64c8eb220a3049dc6162cc4298a06154dfaddd1b",
    "bytes": 4941
  },
  "gr": {
    "sha": "599741eec82f5c8729cfa503f552c9f781f5625b",
    "bytes": 868
  },
  "gt": {
    "sha": "7df9df57926714b70be3d47e81b2d13b150834ba",
    "bytes": 31352
  },
  "gy": {
    "sha": "569fb562759edd11a7ba270c83c752f03be5c042",
    "bytes": 493
  },
  "hn": {
    "sha": "11fde67db930e5cfeae9fc1ba2865b1e91a825e5",
    "bytes": 1144
  },
  "hr": {
    "sha": "b1a6b8341208459ebd81ac227a7a33b615d74c55",
    "bytes": 30727
  },
  "ht": {
    "sha": "8e8efc46b9a9a5418d40e3ba2d31f7a277e4e431",
    "bytes": 13301
  },
  "hu": {
    "sha": "24fbfb965888e2c2f66899dd89942f2e47ca5187",
    "bytes": 264
  },
  "id": {
    "sha": "3b7c8fcfd96578480474bf942e1a0adb604dde0f",
    "bytes": 178
  },
  "in": {
    "sha": "bc47d74911bb32886aa9c611feb36e6fc54ff850",
    "bytes": 1090
  },
  "ie": {
    "sha": "049be14de14f4f67419f3c5e2f0c5d022b74ca39",
    "bytes": 289
  },
  "ir": {
    "sha": "8c6d516216991dea851ae9c2be9e65cd86d8783a",
    "bytes": 15397
  },
  "iq": {
    "sha": "804451474adb04b36660de45e082b6c758f8b7b5",
    "bytes": 1420
  },
  "is": {
    "sha": "a6588afaefd01855a9e5587e0fb52737e03c50bd",
    "bytes": 509
  },
  "il": {
    "sha": "f43be7e8ed7ae29d324f7f1aa0d46528e2a5c3af",
    "bytes": 834
  },
  "it": {
    "sha": "20a8bfdcc802296c682866e18c41a74fbaa702fd",
    "bytes": 289
  },
  "jm": {
    "sha": "269df03836848d552789f9ea6a35ef0993694778",
    "bytes": 401
  },
  "jo": {
    "sha": "d6f927d44f21a21f3c6c23e67fbe144541d5ba66",
    "bytes": 727
  },
  "jp": {
    "sha": "cc1c181ce9b2c22b5d29d04d7858d4d6ed0c878c",
    "bytes": 470
  },
  "kz": {
    "sha": "2fac45bda64a3d840bf898708340cc6ee0d382be",
    "bytes": 7094
  },
  "ke": {
    "sha": "3a67ca3ccd48b1e0fe01fd4741711d462395006d",
    "bytes": 1421
  },
  "kg": {
    "sha": "e26db95356b64999faa48d6b5fca6d8742e7d512",
    "bytes": 4743
  },
  "kh": {
    "sha": "a7d52f2cb41c6b5c83316cdb0c672adf01c44d10",
    "bytes": 7122
  },
  "kr": {
    "sha": "6947eab2b3902872175f81d84f6966e170083c0d",
    "bytes": 1061
  },
  "kw": {
    "sha": "3dd89e9962e65164e4ed41a305f71a1afe027085",
    "bytes": 517
  },
  "la": {
    "sha": "6aea6b72b4050a3e7bf89f4dd545fdb67ef334f4",
    "bytes": 456
  },
  "lb": {
    "sha": "bde2581d2b1eb934cf913c203969f7f2b0f8ca8a",
    "bytes": 2770
  },
  "lr": {
    "sha": "e482ab9d749d63d64cdf337158a2ead10a235d0a",
    "bytes": 713
  },
  "ly": {
    "sha": "1eaa51e468b7ed416ae8c332d8310feda761fa41",
    "bytes": 549
  },
  "lk": {
    "sha": "cbd660a54ac609f29fb6433dd3c637dab91c379f",
    "bytes": 10724
  },
  "ls": {
    "sha": "a7c01a98ffc7cac85a3db0ca42fc8297d7642273",
    "bytes": 1133
  },
  "lt": {
    "sha": "90ec5d240e5e324254b093c8ce70f8d046db16f9",
    "bytes": 439
  },
  "lu": {
    "sha": "cc122068125c02693dee300ebec3909459ac50f7",
    "bytes": 225
  },
  "lv": {
    "sha": "f6dececab891bd3420112183dbec9ee866ad3a1b",
    "bytes": 263
  },
  "ma": {
    "sha": "7ce56eff707c288edbe3071bd8cb495c74dd307c",
    "bytes": 247
  },
  "md": {
    "sha": "e9ba506a2ba85f099e2c11659d90994febde9aac",
    "bytes": 11126
  },
  "mg": {
    "sha": "5fa2d2440d5bfc07bf7863c6c8cbb9648053cc0a",
    "bytes": 299
  },
  "mx": {
    "sha": "e3ec2bc596c05ef55ee501047b768a1702976e45",
    "bytes": 84753
  },
  "mk": {
    "sha": "4f5cae77ed60b6128d062ab55055290295359b77",
    "bytes": 379
  },
  "ml": {
    "sha": "6f6b71695cbb3cb3f00e74d825faf95999fe768e",
    "bytes": 273
  },
  "mm": {
    "sha": "42b4dee2b8ccb00e6dc5817cae1e73e18d1ab46a",
    "bytes": 710
  },
  "me": {
    "sha": "297888c7be5f223629d69c98ac7501043c42bbdf",
    "bytes": 56372
  },
  "mn": {
    "sha": "6a38a71fcf6c712461a5e85f6133bb365ae2a1bb",
    "bytes": 1397
  },
  "mz": {
    "sha": "0f94c3a1aaa2320e891aa5e92b2c11362c770f47",
    "bytes": 2563
  },
  "mr": {
    "sha": "d859972c5d61e8ec1d2aafb6d510f3518588ad03",
    "bytes": 437
  },
  "mw": {
    "sha": "137ff87893c77827771b7ec781a1a78a8578a7f0",
    "bytes": 3563
  },
  "my": {
    "sha": "115f864d8acfc6776feb20d64b9bf852cd32e8e0",
    "bytes": 1378
  },
  "na": {
    "sha": "35b9f783e155a4e380086dc7a8f34ad46f47963d",
    "bytes": 993
  },
  "ne": {
    "sha": "39a82b827744d08b7013215ba2f139c9180d1bf7",
    "bytes": 273
  },
  "ng": {
    "sha": "81eb35f78eb16c26e25ffcb36f9f65720d062b6a",
    "bytes": 257
  },
  "ni": {
    "sha": "e4861f5abaaf19c3c45d7df7208381c9beaaba0f",
    "bytes": 17249
  },
  "nl": {
    "sha": "e90f5b03511fe47d56930eea41341521579dc8fc",
    "bytes": 225
  },
  "no": {
    "sha": "a5f2a152a932b85e30cfc1921325da0e300a75bb",
    "bytes": 318
  },
  "np": {
    "sha": "624285684531217f6a9e99a98ca756965f4c5251",
    "bytes": 1005
  },
  "nz": {
    "sha": "935d8a749d943341ee885010bf1c31bd59809ab3",
    "bytes": 2172
  },
  "om": {
    "sha": "4f1461a000c837da726a8501670e6dc4aeaabcd1",
    "bytes": 22223
  },
  "pk": {
    "sha": "4ddc19f8eaa824f521c01437355fc90e14b05d9d",
    "bytes": 725
  },
  "pa": {
    "sha": "9ab733f4b548825e3c553d2de4ba7767137b7d6e",
    "bytes": 521
  },
  "pe": {
    "sha": "33e6cfd417813982f050488d6256c160185adeaf",
    "bytes": 186
  },
  "ph": {
    "sha": "b910e24cd2292aacdab5731a0ddf17e3f6b42304",
    "bytes": 1382
  },
  "pg": {
    "sha": "7b7e77aad4a512ca0f47d050f6c89d627a47d352",
    "bytes": 1608
  },
  "pl": {
    "sha": "42d2b0ce19161bc528e6f20f2d37691c98f8e366",
    "bytes": 215
  },
  "kp": {
    "sha": "ad1b713f16ecc8b1bc06a391568ded01f627d73d",
    "bytes": 783
  },
  "pt": {
    "sha": "2767cd4e9faa0beec0593e039b899f78c1831fcb",
    "bytes": 8001
  },
  "py": {
    "sha": "abccd87994c05b81c6fa410bc5fa7b9312675127",
    "bytes": 16184
  },
  "qa": {
    "sha": "901f3fa761a3b90598f952e7a321ad71ca7e793d",
    "bytes": 354
  },
  "ro": {
    "sha": "fda0f7bec91d8e31052993b16b794edea4de2f95",
    "bytes": 302
  },
  "ru": {
    "sha": "cf243011ae99e45cb43edf4ca6b7c51e08419c4c",
    "bytes": 225
  },
  "rw": {
    "sha": "06e26ae44e4ef16948b32f246c5aafded2982635",
    "bytes": 755
  },
  "sa": {
    "sha": "596cf48bb7b6005ba3fb4da6d9d6ae0b6451fa0b",
    "bytes": 9968
  },
  "sd": {
    "sha": "12818b4110dbe25327131f9ec898aa2e73b85fc6",
    "bytes": 505
  },
  "sn": {
    "sha": "ba8606559120bf0cca396d8d81888f8cad0e75fd",
    "bytes": 417
  },
  "sb": {
    "sha": "6066f94cd1170ea93e50e657c649e1ae75dbeea1",
    "bytes": 940
  },
  "sl": {
    "sha": "a07baf75b40f2cbd4fc060ecf2043590c63146d1",
    "bytes": 272
  },
  "sv": {
    "sha": "cbc674a6e7c4ec288026a85d06876121ce0e69a4",
    "bytes": 77273
  },
  "so": {
    "sha": "a581ac63cfaf2f58a7b5c685f620188d2c7ce826",
    "bytes": 483
  },
  "rs": {
    "sha": "6d4f74d7671194c6bcc9ef761f203b23805cace2",
    "bytes": 181634
  },
  "ss": {
    "sha": "b257aa0b3e505f31f93446067b59bef8a033c58c",
    "bytes": 398
  },
  "sr": {
    "sha": "5e71c400262bac42b8f8fdd36c9a789e78c5a13b",
    "bytes": 312
  },
  "sk": {
    "sha": "676018e6284fcfed6c878552ef1e662fac4395dd",
    "bytes": 1182
  },
  "si": {
    "sha": "1bbdd94fd25406e21c452a2a905343f3298672cf",
    "bytes": 1993
  },
  "se": {
    "sha": "8ba745acaf2231a519e658852e8ef874dbeb8dc7",
    "bytes": 209
  },
  "sz": {
    "sha": "eb538e4476350ce9984091c289c44b5cc68b2742",
    "bytes": 4663
  },
  "sy": {
    "sha": "97c05cfc93b1e68d3336507be6f885a52d353252",
    "bytes": 366
  },
  "td": {
    "sha": "fa3bd927c1580108677d5936898ebd9d87737d09",
    "bytes": 271
  },
  "tg": {
    "sha": "9d6ea6c5d4882291e63193b8e878910ef13cf9b7",
    "bytes": 708
  },
  "th": {
    "sha": "1e93a61e95bfe4bd0494ffa27d24dc4fd798eb95",
    "bytes": 284
  },
  "tj": {
    "sha": "f8c9a0371cb0311a340f5fb9fb327885a01f1851",
    "bytes": 1843
  },
  "tm": {
    "sha": "4154ed765cfc20762704c5b0da3e8c95b36cb75c",
    "bytes": 38349
  },
  "tl": {
    "sha": "3d0701a2c8c8da8ee7b7736c49aa6a551c0d5a93",
    "bytes": 611
  },
  "tt": {
    "sha": "bc24938cf8ead7002e283b29f70b8d34ff5e8607",
    "bytes": 304
  },
  "tn": {
    "sha": "5735c1984de39c02488cafaebbd34d91f79c93bf",
    "bytes": 343
  },
  "tr": {
    "sha": "b96da21f0e98bfaeee3312cf938417bdc4ec2639",
    "bytes": 549
  },
  "tz": {
    "sha": "a2cfbca42aa2695c6a539fef2c4ee5c44f4f2114",
    "bytes": 548
  },
  "ug": {
    "sha": "520eee5c7c1f005c971bd114302f9cb0b844e8fa",
    "bytes": 3929
  },
  "ua": {
    "sha": "03daa196837a4c6194ee0d015a866943bc859079",
    "bytes": 234
  },
  "uy": {
    "sha": "62c36f8e5e68e03d24497629b1dc34a2955d9985",
    "bytes": 1724
  },
  "us": {
    "sha": "9cfd0c927f975b7afff364179c2b850e525236c3",
    "bytes": 648
  },
  "uz": {
    "sha": "0ccca1b1b4aa9cfaf14911a49e5a89dfac314d14",
    "bytes": 1498
  },
  "ve": {
    "sha": "314e7f5f7f53c3f069830afd15ec278b820f00b9",
    "bytes": 1206
  },
  "vn": {
    "sha": "7e4bac8f4acf3a8dc4cda58e9a3696ca65f8e91e",
    "bytes": 490
  },
  "vu": {
    "sha": "5cd5ab575f319fe39d06fa3f2f0d5b3bb397924a",
    "bytes": 1782
  },
  "ye": {
    "sha": "de7bd613ecd7e494d1ed3c3b1e0ec749e0efd915",
    "bytes": 281
  },
  "za": {
    "sha": "d563adb90c0c20b32d666b9903b8ad88722f1372",
    "bytes": 860
  },
  "zm": {
    "sha": "360f37aa19db6a0f271ffb24130b4fa836a56c56",
    "bytes": 5421
  },
  "zw": {
    "sha": "93aac4f6cf2d11335854da77e992cebb8df50695",
    "bytes": 6186
  }
};
const LICENSES = [
  { repository: "lipis/flag-icons", revision: FLAG_REVISION, source: "LICENSE", target: "assets/country-quiz/LICENSE-flag-icons.txt", sha: "ee959dc1d045dc91fa3daed6ac73fef53700cf5f" },
  { repository: "mledoze/countries", revision: COUNTRY_REVISION, source: "LICENSE", target: "assets/country-quiz/LICENSE-world-countries.md", sha: "b03120fdfc027ace0e634e9e0c71581c77f660c0" }
];

const gitHash = (buffer) => crypto.createHash("sha1")
  .update(Buffer.from("blob " + buffer.length + "\0")).update(buffer).digest("hex");

function readList() {
  const source = fs.readFileSync(path.join(ROOT, "data/country-quiz.js"), "utf8");
  const list = vm.runInNewContext(source + ";COUNTRY_QUIZ_LIST");
  if (!Array.isArray(list) || !list.length) throw new Error("คลังประเทศต้องไม่ว่าง");
  const unique = new Set();
  list.forEach((country) => {
    if (!/^[a-z]{2}$/.test(country.iso2) || unique.has(country.iso2))
      throw new Error("รหัสธงไม่ถูกต้องหรือซ้ำ: " + country.iso2);
    unique.add(country.iso2);
    if (country.flag !== "assets/country-quiz/flags/" + country.iso2 + ".svg" || !FLAG_SOURCES[country.iso2])
      throw new Error("ไม่มีต้นทางธงที่ตรวจไว้: " + country.code);
  });
  return list;
}

function verifySvg(buffer, label) {
  const text = buffer.toString("utf8").trim();
  if (!/^<svg\b/i.test(text) || !/<\/svg>\s*$/i.test(text) || !/\bviewBox\s*=\s*["'][^"']+["']/i.test(text))
    throw new Error("ไฟล์ไม่ใช่ SVG ที่มีกรอบภาพ: " + label);
  if (/<!DOCTYPE|<!ENTITY|<\s*(script|foreignObject|image)\b|\bon[a-z]+\s*=/i.test(text))
    throw new Error("SVG มีส่วนที่ไม่ใช้แสดงธง: " + label);
  for (const match of text.matchAll(/\b(?:xlink:)?href\s*=\s*(["'])(.*?)\1/gi)) {
    if (!match[2].startsWith("#")) throw new Error("SVG อ้างไฟล์ภายนอก: " + label);
  }
  for (const match of text.matchAll(/url\(\s*(["']?)(.*?)\1\s*\)/gi)) {
    if (!match[2].trim().startsWith("#")) throw new Error("SVG อ้างรูปภายนอก: " + label);
  }
}

async function download(repository, revision, source, sha) {
  const url = "https://raw.githubusercontent.com/" + repository + "/" + revision + "/" + source;
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error("HTTP " + response.status + ": " + source);
      const buffer = Buffer.from(await response.arrayBuffer());
      if (!buffer.length || buffer.length > 2 * 1024 * 1024 || gitHash(buffer) !== sha)
        throw new Error("รหัสต้นฉบับไม่ตรง: " + source);
      return buffer;
    } catch (error) {
      lastError = error;
      if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
    }
  }
  throw lastError;
}

async function ensureFile(item, checkOnly, svg) {
  const target = path.join(ROOT, item.target);
  let buffer = fs.existsSync(target) ? fs.readFileSync(target) : null;
  if (!buffer || gitHash(buffer) !== item.sha) {
    if (checkOnly) throw new Error("ไม่มีไฟล์หรือไม่ตรงต้นทาง: " + item.target);
    buffer = await download(item.repository, item.revision, item.source, item.sha);
    if (svg) verifySvg(buffer, item.target);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, buffer);
  }
  if (gitHash(buffer) !== item.sha) throw new Error("ตรวจรหัสไฟล์ไม่ผ่าน: " + item.target);
  if (svg) verifySvg(buffer, item.target);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== "--check")) throw new Error("ใช้ได้เฉพาะตัวเลือก --check");
  const checkOnly = args.includes("--check");
  const countries = readList();
  const tasks = countries.map((country) => ({
    repository: "lipis/flag-icons", revision: FLAG_REVISION,
    source: "flags/4x3/" + country.iso2 + ".svg",
    target: country.flag, sha: FLAG_SOURCES[country.iso2].sha
  }));
  let position = 0;
  async function worker() {
    while (position < tasks.length) {
      const item = tasks[position++];
      await ensureFile(item, checkOnly, true);
    }
  }
  await Promise.all(Array.from({ length: Math.min(6, tasks.length) }, worker));
  for (const license of LICENSES) await ensureFile(license, checkOnly, false);
  console.log((checkOnly ? "ตรวจ" : "ดึงและตรวจ") + "ภาพธงครบ " + countries.length + " ประเทศ พร้อมสัญญาอนุญาต 2 ไฟล์");
}

if (require.main === module) main().catch((error) => {
  console.error("เตรียมภาพธงไม่สำเร็จ: " + error.message);
  process.exitCode = 1;
});

module.exports = { FLAG_REVISION, COUNTRY_REVISION, FLAG_SOURCES, gitHash, verifySvg, readList, main };
