chrome.runtime.onMessage.addListener(({ msg, count }, { tab }) => {
	if (msg !== "UPDATE-BADGE") return

	if (count > 0)
		chrome.action.setBadgeText({
			tabId: tab.id,
			text: count + "",
		})
	else
		chrome.action.setBadgeText({
			tabId: tab.id,
			text: "",
		})
})
