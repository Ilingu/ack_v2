# ADKami Web Scrapping API 🌐

#### ➡️ Scrapping Api to retrieve the lastest released anime episodes from [<u>ADKami</u>](https://www.adkami.com/) ✨

## 📕 Purpose and origin:

➡️ This API is excusively made for [ACK](https://github.com/Ilingu/ack_v2) and does not interact with adkami (no login, commenting...), it just retrieves (reads only) some datas displayed.

It works very easily: first go handle the request, second I open a botless detection browser that go to **adkami**, from here it's simple, I crawl the page's DOM to extract all the wanted information and eventually send back to the origin of request.

_Quick note: I hate cloudfare from the bottom of my soul ＞﹏＜_

One big issue was the dreaded cloudfare **protection** for bots, very annoying but the library that I used already implemented a **stealth** so no worry. After several ⚡**BUG**⚡, I managed to bypass all the cloudfare protection _(somehow?)_. It was a **very great short experience** (and it's what I love about webdev).

As a result, I reenforced my Go and Docker skills as well as my web scrapping (and web cloudfare bypassing ＞﹏＜) skills.

## Made With:

1. **Elegance** ✅
2. `Go` (Obvioulsy...) ✨
3. `Stdlib` for the API endpoints 🌐
4. ➡️ [`rod`](https://go-rod.github.io/) for the automated browser 🤖 (like puppeteer but for Golang)
5. `Docker` 🐳 for the deployment on [Railway](https://railway.app/)

## ⬇️ Installing:

For some oubvious reason (I'm broke), I can't share with you the railway url of this api otherwise my montly free credit will be tortured. But you can install and deploy it by yourself:

➡️ This app works on [`Go 1.18`]

- Via the bundled executable in this repo releases
- <s>Via [**Docker Hub**] with this Image name: `ilingu/adkami-scrapping-api`</s> **I currently have some issue with my connection speed, so I can't upload the docker image on hub yet**
  - The binary file is in `/app/server/bin/api`

## License

MIT - OPENSOURCE
