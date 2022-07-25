# 9Anime Web Scrapping API 🌐

#### ➡️ Golang Api that given an anime name will scrap 9anime to return the corresponding anime page link on 9anime ✨

## 📕 Purpose and origin:

This API is excusively made for [ACK](https://github.com/Ilingu/ack_v2). In this app, a feature require to know the 9anime anime url page of this anime to work.

Before, it was muchhhhh easier because 9anime didn't protect anything from BOTs (or very badly), so back then I was making the url on the fly (because they is a simple template in their search endpoints), then requesting the URL (simple HTTP/GET), it returned the HTML file and with some DOM manipulations (cheerio) I was able to exctract the anime's page url. But this utopic world couldn't continue _sniff_.

Since their update, they include the dreaded cloudfare protection, and for each request you must provid some type of IDs that only cloudfare know... So no more free and simple requests, they killed the utopic world.

So I was forced to make a web crawling api, with an automated browser that will simulate the user behavior in order to get this **Anime URL**. _So much to do, just to get a href attribute... I hate cloudfare from the bottom of my soul ＞﹏＜_

After several ⚡**BUG**⚡, I managed to bypass all the cloudfare protection _(somehow?)_. It was a **very great short experience** (and it's what I love about webdev).

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

- <s>Via [**Docker Hub**] with this Image name: `ilingu/9animelink-scrapping-api`</s> **I currently have some issue with my connection speed, so I can't upload the docker image on hub yet**
  - The binary file is in `/app/server/bin/api`
- Via the source code, for this you want on your machine:
  - **Docker**
  - **Go**
  - <s>NodeJS _because it's always good pratice to have node installed_</s>
