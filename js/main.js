/* eslint-disable no-unused-vars */
/* eslint-disable no-restricted-syntax */
/* globals countUp */
/* theme */
let darkMode = (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) || false

// to-do: remember theme value, especially if we are going to have multiple pages
function updateTheme() {
    document.body.dataset.theme = (darkMode ? "dark" : "light")
    if (document.querySelector("#theme-switch").checked !== darkMode) document.querySelector("#theme-switch").checked = darkMode
}
updateTheme()

document.querySelector("#theme-switch").addEventListener("change", (e) => {
    darkMode = e.target.checked
    updateTheme()
})

/* counters */
const options = {
    duration: 0.5,
    separator: " "
}

let memberCounter
let messageCounter
let showcasedProfiles

function processMarkdown(str) {
    return str
        // Escape HTML
        .replace(/&/g, "&amp;")
        // .replace(/</g, "&lt;")
        // .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
        // Markdown processing
        .replace(/<(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)*?)>/g, "<a href='$1'>$1</a>")
        .replace(/^> (.*$)/g, "<blockquote>$1</blockquote>")
        .replace(/\*\*(.*)\*\*/g, "<b>$1</b>")
        .replace(/\*(.*)\*/g, "<i>$1</i>")
        .replace(/\\n/g, "<br/>")
}

function getAverageColor(image) {
    const context = document.createElement("canvas").getContext("2d")
    context.imageSmoothingEnabled = true
    context.drawImage(
        image, 0, 0, 1, 1
    )
    return `rgb(${context.getImageData(
        0, 0, 1, 1
    ).data.slice(0, 3).join(", ")})`
}

function getAccountLink(account) {
    if (account.type === "steam") return `https://steamcommunity.com/profiles/${account.id}`
    if (account.type === "twitter") return `https://twitter.com/${account.name}`
    if (account.type === "github") return `https://github.com/${account.name}`
    if (account.type === "spotify") return `https://open.spotify.com/user/${account.id}`
    return null
}

const flagLogos = {
    HOUSE_BRILLIANCE: "assets/icons/h_brilliance.svg",
    HOUSE_BALANCE: "assets/icons/h_balance.svg",
    HOUSE_BRAVERY: "assets/icons/h_bravery.svg"
}

function updateAnalytics() {
    if (document.hasFocus() || !memberCounter || !messageCounter || !showcasedProfiles) {
        // Counters
        fetch("http://api.testausserveri.f/v1/discord/guildInfo")
            .then((res) => res.json())
            .then((data) => {
                if (!memberCounter || !messageCounter) {
                    memberCounter = new countUp.CountUp(
                        "memberCount", data.memberCount, options
                    )
                    messageCounter = new countUp.CountUp(
                        "messageCount", data.messagesToday, options
                    )
                    memberCounter.start()
                    messageCounter.start()
                }
                memberCounter.update(data.memberCount)
                messageCounter.update(data.messagesToday)
            })

        // Profile showcases
        fetch("http://api.testausserveri.fi/v1/discord/roleInfo?id=743950610080071801")
            .then((res) => res.json())
            .then((data) => {
                // TODO: Why is this like this?
                // eslint-disable-next-line eqeqeq
                if (JSON.stringify(showcasedProfiles) == JSON.stringify(data.members)) return
                document.getElementById("cards").innerHTML = ""
                showcasedProfiles = data.members
                for (const member of data.members) {
                // Main element
                    const card = document.createElement("div")
                    card.className = "card"
                    // Banner
                    const banner = document.createElement("img")
                    banner.className = "banner"
                    banner.src = member.banner ? `${member.banner}?size=600` : "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="
                    banner.style.backgroundColor = member.color
                    card.appendChild(banner)
                    // Profile picture
                    const profilePicture = document.createElement("img")
                    profilePicture.className = "profile-picture"
                    // Set banner color, if not present
                    profilePicture.onload = () => {
                        banner.style.backgroundColor = member.color ?? getAverageColor(profilePicture)
                    }
                    profilePicture.crossOrigin = "Anonymous"
                    profilePicture.src = member.avatar
                    card.appendChild(profilePicture)
                    // Flags
                    const flags = document.createElement("ul")
                    flags.className = "flags"
                    for (const flag of member.flags) {
                        if (flag.startsWith("HOUSE")) {
                            const item = document.createElement("li")
                            const img = document.createElement("img")
                            img.src = flagLogos[flag]
                            item.appendChild(img)
                            flags.appendChild(item)
                        } else {
                            console.error("Unknown member flag", flag)
                        }
                    }
                    card.appendChild(flags)
                    // Display-name
                    const displayName = document.createElement("p")
                    displayName.className = "displayname"
                    displayName.innerText = member.displayName
                    card.appendChild(displayName)
                    // Account name
                    const name = document.createElement("p")
                    name.className = "name"
                    name.innerText = `${member.name}#${member.discriminator}`
                    card.appendChild(name)
                    // Status
                    const customStatusData = member.presence.filter((item) => item.type === "CUSTOM")[0]
                    const status = document.createElement("p")
                    status.className = "status"
                    if (customStatusData !== undefined) {
                        const { emoji } = customStatusData
                        if (emoji && emoji.url) {
                            const img = document.createElement("img")
                            img.src = emoji.url
                            img.alt = emoji.name
                            status.appendChild(img)
                        }
                        status.appendChild(document.createTextNode(customStatusData.state))
                    } else {
                        status.innerText = " "
                    }
                    card.appendChild(status)
                    // Spacer
                    const line = document.createElement("div")
                    line.className = "line"
                    card.appendChild(line)
                    // Bio
                    const bio = document.createElement("p")
                    bio.className = "about"
                    bio.innerHTML = member.bio ? processMarkdown(member.bio) : ""
                    card.appendChild(bio)
                    // Title
                    const title = document.createElement("p")
                    title.className = "activity"
                    title.innerText = "TILA"
                    card.appendChild(title)
                    // Activities
                    const activities = document.createElement("ul")
                    activities.className = "activities"
                    for (const activity of member.presence.filter((item) => item.type !== "CUSTOM")) {
                        const item = document.createElement("li")
                        // Image combo
                        const largeImage = document.createElement("img")
                        largeImage.className = "largeImage"
                        largeImage.src = activity.assets.largeImage ?? ""
                        largeImage.alt = activity.assets.largeImageText ?? ""
                        const smallImage = document.createElement("img")
                        smallImage.className = "smallImage"
                        if (activity.name === "Spotify" && activity.type === "LISTENING") {
                            smallImage.src = "assets/icons/accounts/spotify.svg"
                        } else {
                            smallImage.src = activity.assets.smallImage ?? ""
                        }
                        smallImage.alt = activity.assets.smallImageText ?? ""
                        item.appendChild(largeImage)
                        item.appendChild(smallImage)
                        // Name
                        const activityName = document.createElement("p")
                        activityName.className = "name"
                        activityName.innerText = activity.name
                        item.appendChild(activityName)
                        // Details
                        const text = document.createElement("p")
                        text.className = "text"
                        text.innerText = `${activity.details ?? ""}\n${activity.state ?? ""}`
                        item.appendChild(text)
                        activities.appendChild(item)
                    }
                    card.appendChild(activities)
                    if (activities.innerHTML === "") activities.innerText = "..."
                    // Spacer
                    const line2 = document.createElement("div")
                    line2.className = "line"
                    card.appendChild(line2)
                    // Connected accounts
                    const accounts = document.createElement("ul")
                    accounts.className = "accounts"
                    for (const account of member.connectedAccounts) {
                        const item = document.createElement("li")
                        const link = document.createElement("a")
                        link.href = getAccountLink(account)
                        // Image
                        const image = document.createElement("img")
                        image.src = `assets/icons/accounts/${account.type}.svg`
                        image.className = "logo"
                        link.appendChild(image)
                        // Text
                        const text = document.createElement("p")
                        text.innerText = account.name
                        link.appendChild(text)
                        item.appendChild(link)
                        accounts.appendChild(item)
                    }
                    if (accounts.children.length !== 0) card.appendChild(accounts)

                    // Append to cards element
                    document.getElementById("cards").appendChild(card)
                }
            })
    } else {
        // console.log('Tab not focused, not updating...');
    }
}
updateAnalytics()
window.addEventListener("focus", () => {
    setTimeout(updateAnalytics, 500)
})
setInterval(updateAnalytics, 5100)

/* projects */
class Grid {
    constructor(data, selector) {
        this.data = data
        this.target = document.querySelector(selector)
        this.render()
    }

    render() {
        this.data.forEach((item, i) => {
            let domItem
            if (item.url) {
                domItem = document.createElement("a")
                domItem.href = `${item.url}?utm_source=testausserveri&utm_medium=homepage&utm_campaign=projects` // append some analytic magic
                domItem.setAttribute("rel", "noopener noreferrer")
                domItem.setAttribute("target", "_blank")
            } else {
                domItem = document.createElement("div")
            }

            domItem.className = "item"

            if (item.video) {
                const domBackground = document.createElement("video")
                domBackground.setAttribute("poster", item.image)
                domBackground.autoplay = true
                domBackground.loop = true
                domBackground.muted = true
                domBackground.setAttribute("playsinline", "")
                domBackground.className = "itemBackground"
                domBackground.id = `bg${i}`
                const domBackgroundSource = document.createElement("source")
                domBackgroundSource.setAttribute("src", item.video)
                domBackgroundSource.setAttribute("type", "video/mp4")
                domBackground.appendChild(domBackgroundSource)
                domItem.appendChild(domBackground)
            } else {
                const domBackground = document.createElement("div")
                domBackground.className = "itemBackground"
                domBackground.style["background-image"] = `url('${item.image}')`
                domItem.appendChild(domBackground)
            }

            const domContent = document.createElement("div")
            domContent.className = "itemContent"

            domContent.onclick = () => { document.querySelector(`#bg${i}`).play() }
            const domContentBig = document.createElement("div")
            domContentBig.className = "CBig"

            const domTitle = document.createElement("h3")
            domTitle.className = "piTitle"
            domTitle.innerHTML = item.name

            const domDesc = document.createElement("span")
            domDesc.className = "piOrg"
            domDesc.innerHTML = (item.desc ? item.desc.replace(/\n/g, "<br>") : item.real)
            domContentBig.appendChild(domTitle)
            domContentBig.appendChild(domDesc)
            if (item.additionalCardHtml) {
                const domContentSmall = document.createElement("div")
                domContentSmall.innerHTML = item.additionalCardHtml
                domContent.appendChild(domContentSmall)
            }

            domContent.appendChild(domContentBig)
            domItem.appendChild(domContent)

            this.target.className = "grid"
            this.target.appendChild(domItem)
        })
    }
}
fetch("https://testausserveri.fi/projects.json")
    .then((res) => res.json())
    .then((data) => {
        // eslint-disable-next-line no-unused-vars
        const projects = new Grid(data.projects, "#projects")
    }).catch((e) => {
        console.error("Failed to get projects list", e)
        document.getElementById("projects").innerHTML = "<p style=\"text-align: center;\">Projektilistaa ei voida näyttää. Tapahtui virhe :(</p>"
    })

function metaRepoLink() {
    alert("Muiden projektien lista näkyy ainoastaan Testausserverin jäsenille. Liity ensin palvelimellemme ja sitä kautta GitHub-organisaatioomme nähdäksesi tämän listan.")
}
