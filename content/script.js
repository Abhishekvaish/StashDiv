"use strict"

chrome.runtime.onConnect.addListener(port => {
	// console.log("Connected to port : ", port)

	port.onDisconnect.addListener(obj => {
		removeEventListeners()
	})
})

const data_map = new Map()
const hoverDiv = document.createElement("div")
hoverDiv.hoverElement = null
hoverDiv.style.cssText = `
	background: blueviolet;
	pointer-events: none;
	position: fixed;
	opacity: 0.4;
	z-index: 10000;
`

if (document.readyState === "complete") {
	// console.log("document is already ready, just execute code here")
	init()
} else {
	// console.log("document was not ready, onload code here")

	window.addEventListener("load", function () {
		// console.log("document was not ready, place code here")
		init()
	})
}

function init() {
	chrome.storage.sync.get({ [window.location.host]: [] }, ({ [window.location.host]: data }) => {
		data.forEach(xpath => mapAndHideElement(xpath))

		chrome.runtime.sendMessage({
			msg: "UPDATE-BADGE",
			count: data.length,
		})

		chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
			if (req.message === "hide-div") {
				// console.log("added listerns click to remove")
				addEventListeners(hoverDiv, data)
			} else if (req.message === "show-hidden-div") {
				// console.log("show hidden element", req.xpath)
				showHiddenDiv(req.xpath)
			}
		})
		chrome.runtime.onConnect.addListener(port => {
			if (port.name === "StashDiv") port.onDisconnect.addListener(removeEventListener)
		})
	})
}

function addEventListeners(hoverDiv, data) {
	document.body.appendChild(hoverDiv)
	document.body.addEventListener("mousemove", mouseMoveHandler)
	document.body.addEventListener("scroll", mouseMoveHandler)
	document.body.addEventListener("mouseleave", mouseLeaveHandler)
	document.body.addEventListener("click", clickHandler)
}

function removeEventListeners() {
	hoverDiv.style.cssText += `width:0;height:0`
	hoverDiv.remove()
	document.body.removeEventListener("mousemove", mouseMoveHandler)
	document.body.removeEventListener("scroll", mouseMoveHandler)
	document.body.removeEventListener("mouseleave", mouseLeaveHandler)
	document.body.removeEventListener("click", clickHandler)
}

// event listeners
function mouseMoveHandler({ target }) {
	if (hoverDiv.hoverElement == target) return

	hoverDiv.hoverElement = target
	let { top, left, height, width } = hoverDiv.hoverElement.getBoundingClientRect()
	hoverDiv.style.cssText += `
		width:${width}px ; 
		height:${height}px ; 
		top:${top}px ; 
		left:${left}px
	`
}
function mouseLeaveHandler(e) {
	if (hoverDiv.hoverElement === null) return
	hoverDiv.hoverElement = null
	hoverDiv.style.cssText += "width:0;height:0;"
}
function clickHandler(e) {
	e.preventDefault()
	if (hoverDiv.hoverElement == null) return
	const xpath = getXPathTo(hoverDiv.hoverElement)
	mapAndHideElement(xpath)
	chrome.storage.sync.set({ [window.location.host]: [...data_map.keys()] })
	chrome.runtime.sendMessage({
		msg: "UPDATE-BADGE",
		count: data_map.size,
	})
	removeEventListeners()
}

// helper functions
function mapAndHideElement(xpath) {
	const node = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
	// console.log(xpath, node)
	if (!node) return
	data_map.set(xpath, node)
	// node.style.oldDisplay = node.style.display
	node.style.visibility = "hidden"
}
function showHiddenDiv(xpath) {
	const node = data_map.get(xpath)
	data_map.delete(xpath)
	node.style.visibility = "visible"
	chrome.storage.sync.set({ [window.location.host]: [...data_map.keys()] })
	chrome.runtime.sendMessage({
		msg: "UPDATE-BADGE",
		count: data_map.size,
	})
}

function getXPathTo(element, path = "") {
	if (element.id !== "") return `id("${element.id}")${path}`
	if (element === document.body) return `HTML/${element.tagName}${path}`

	var ix = 1
	for (let sibling of element.parentNode.childNodes) {
		if (sibling === element) return getXPathTo(element.parentNode, `/${element.tagName}[${ix}]${path}`)
		if (sibling.nodeType === 1 && sibling.tagName === element.tagName) ix++
	}
}
