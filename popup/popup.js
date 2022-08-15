const helpTextElement = document.querySelector(".help-text")

chrome.tabs.query({ currentWindow: true, active: true }, tabs => {
	const activeTab = tabs[0]
	const url = new URL(activeTab.url)

	chrome.tabs.connect(activeTab.id)

	chrome.storage.sync.get({ [url.host]: [] }, ({ [url.host]: data }) => {
		document.querySelector("#hide-div").onclick = () => sendHideDivRequest(activeTab.id)
		showHiddenDiv(activeTab.id, data)
	})
})

function sendHideDivRequest(activeTabId) {
	helpTextElement.style.visibility = "visible"
	chrome.tabs.sendMessage(activeTabId, {
		message: "hide-div",
	})
}
function showHiddenDiv(activeTabId, data) {
	const listDiv = document.querySelector(".list-div")
	listDiv.replaceChildren()

	data.forEach(xpath => {
		const div = document.createElement("div")
		div.textContent = xpath
		div.onclick = e => {
			e.preventDefault()
			chrome.tabs.sendMessage(activeTabId, {
				xpath: xpath,
				message: "show-hidden-div",
			})
			div.remove()
		}
		listDiv.append(div)
	})
}
