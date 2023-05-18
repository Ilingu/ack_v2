# [MAINTENANCE], as of May 18 2023, ack backend (firebase) was shutdown; thus I have to recreate an entire backend service (problably in pocketbase) from scratch; this'll take quite a while and I currently don't even think I'll have the strenght to do it.

---

# [ACK] MyAnimList :: List your anime

#### ➡️ **ACK is a [MAL](https://myanimelist.net/) data based web app (PWA) to track your animes progression with a fancy Design ✨**

#### ➡️ [⚡ Check it out!](https://ack.vercel.app/)

#### ➡️ Your are currently at the root of this mono repo, Go Check [**the Web App**](https://github.com/Ilingu/ack_v2/tree/main/ack_app)

## 📕 Purpose and origin:

You remember the COVID19 lockdown? Yea me too, this was a pretty crazy period for me and my programming skills 📈
During this period I watch a **LOT** of anime, and it was pretty painful (to not say impossible) to keep track of my animes progression since I watched them on _illegal sites_ 😅. So I created this.

Over the year this project has changed a lot but in the same time always does the same thing. There was the [**V1** of this project]() (May 2020-August 2021) which was a playground/sandbox, my first react app where I learn **a LOT**, but since at that time I was a noobie (I'm still a noobie but less?) this app swiftly began to be a mess with lots of spaghettis codes 🍝, it was unmaintainable, besides this app was CSR with `create-react-app` with a lot of dead library, CSS written in files with bootsrap, horrible files structures, and the best of all: I used javascript and Class Components... Moreover, although this app worked more or less well (terrible performance at the end) I wanted to have a better looking and modern version of this app that shows all the knowledge that I acquired during this V1.

That how this app is born, the AnimChecker V2 (aka **ack_v2**) **from November 2021 to now**. It use SSR,SSG... Typescript, tailwind, modern and advanced coding practices, the V1 was this mentality: "it should work, no matter how I do it." the V2 is more like: "it should work with the best solutions" by following this mentality I made a lot of sacrifices but also learn a considerable amount of things coming from errors that are now carved on my mind, e.g The V2 has far less functionnalities than the V1 but it's on purpose, because some of these were irrevelant or "too much", plus at the end of V1 it a 2 apps in one which does not respect the principle of [**Single responsibility**](https://en.wikipedia.org/wiki/Single-responsibility_principle) at all. With this app I take my time to better understand what I'm doing and how to be able even in 5y to not restart with a V3.

You may also wonder why I don't use some premade services like **MAL** or else? Simply because I wanted a very personalized app (with a good looking UI), that meet only my demand, and not the demand of Millions of users, and apart from that the purpose of this app was to exerce my webdev skills.

## Made With:

1. **Elegance** ✅
2. `Next.js` ✨ (with _next-pwa_)
3. `TypeScript` for Type Safety 😎
4. `TailwindCSS` The only **True** CSS (～￣ ▽ ￣)～
5. `tRPC` for api Type Safety 🌐 **Awesome DX**✨
6. `Firebase` plan to change soon ❌ (it's an relatively old project so back then I chose Firebase)
7. `Cypress/Vitest` for **E2E** and **Unit** testing 🤖

### Uninteresting stuff

2022 [Ilingu](https://github.com/Ilingu)  
[![SITE](https://img.shields.io/badge/Licence-MIT-yellow)](https://github.com/Ilingu/ack_v2/blob/main/LICENSE)
