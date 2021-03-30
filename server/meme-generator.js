/**
 * this module is an adaptation of nodejs-meme-generator
 */

'use strict'

const request = require('request').defaults({encoding: null})
const Canvas = require('canvas')
const fs = require('fs')

/**
 * meme class
 *
 * @param userConfig
 * @constructor
 */
function MemeGenerator (userConfig = {}) {
	const {canvasOptions, fontOptions} = userConfig;
	const config = Object.assign({
		canvasOptions: {
			canvasWidth: 500,
			canvasHeight: 500
		},
		fontOptions: {
			fontFamily: 'impact',
			fontSize: 46,
			lineHeight: 2
		}
	}, canvasOptions ? {canvasOptions: canvasOptions} : null,
	fontOptions ? {fontOptions: fontOptions} : null)

	this.setCanvas(config.canvasOptions)
	this.setFontOptions(config.fontOptions)
}

/**
 * sets canvas
 *
 * @param options
 */
MemeGenerator.prototype.setCanvas = function (options) {
	const {canvasWidth, canvasHeight} = options
	const canvas = Canvas.createCanvas(canvasWidth, canvasHeight)
	const Image = Canvas.Image

	this.canvas = canvas
	this.ctx = canvas.getContext('2d')
	this.canvasImg = new Image()

	this.ctx.lineWidth  = 2
	this.ctx.strokeStyle = 'black'
	this.ctx.mutterLine = 2
	this.ctx.fillStyle = 'white'
	this.ctx.textAlign = 'center'
}

/**
 * sets fonts options
 *
 * @param options
 */
MemeGenerator.prototype.setFontOptions = function (options) {
	const {fontFamily, fontSize, lineHeight} = options

	this.fontFamily = fontFamily
	this.fontSize = fontSize
	this.lineHeight = lineHeight
}

/**
 * sets image options
 * 
 * @param {Object} options {topText, bottomText, url}
 */
MemeGenerator.prototype.setImageOptions = function (options) {
	const {topText, topSize, topX, topY, topBold, topItalic, topColor,
		bottomText, bottomSize, bottomX, bottomY, bottomBold, bottomItalic, bottomColor,
		url} = options

	this.url = url
	this.topText = topText
	this.topSize = topSize
	this.topX = topX
	this.topY = topY
	this.topBold = topBold
	this.topItalic = topItalic
	this.topColor = topColor

	this.bottomText = bottomText
	this.bottomSize = bottomSize
	this.bottomX = bottomX
	this.bottomY = bottomY
	this.bottomBold = bottomBold
	this.bottomItalic = bottomItalic
	this.bottomColor = bottomColor
}

/**
 * generates meme by local file or image url
 * 
 * @param {Object} imageOptions {topText, bottomText, url}
 */
MemeGenerator.prototype.generateMeme = function (imageOptions) {
	this.setImageOptions(imageOptions)

	return new Promise((resolve, reject) => {
		if (!this.url.includes('http')) {
			let that = this
			fs.readFile(this.url, function(err, data) {
				if (err) {
					reject(new Error('The image could not be loaded.'))
				}
				that.canvasImg.src = new Buffer(data)

				that.calculateCanvasSize()
				that.drawMeme()

				resolve(that.canvas.toBuffer())
			})
		} else {
			request.get(this.url, (error, response, body) => {
				if (!error && response.statusCode === 200) {
					this.canvasImg.src = new Buffer(body)

					this.calculateCanvasSize()
					this.drawMeme()

					resolve(this.canvas.toBuffer())
				} else {
					reject(new Error('The image could not be loaded.'))
				}
			})
		}
	})
}

/**
 *
 */
MemeGenerator.prototype.calculateCanvasSize = function () {
	const {canvas, canvasImg} = this

	canvas.height = canvasImg.height / canvasImg.width * canvas.width

	this.memeWidth = canvas.width
	this.memeHeight = canvas.height
}

/**
 * draws memes
 */
MemeGenerator.prototype.drawMeme = function () {
	const {
		canvas,
		canvasImg,
		memeWidth,
		memeHeight,
		topText,
		topSize,
		topX,
		topY,
		topBold,
		topItalic,
		topColor,
		bottomText,
		bottomSize,
		bottomX,
		bottomY,
		bottomBold,
		bottomItalic,
		bottomColor,
		fontSize,
		fontFamily,
		lineHeight,
		ctx,
		wrapText
	} = this

	ctx.clearRect(0, 0, canvas.width, canvas.height)
	ctx.drawImage(canvasImg, 0, 0, memeWidth, memeHeight)

	console.log(topSize)

	let topFontSize = topSize ? topSize : fontSize
	let bottomFontSize = bottomSize ? bottomSize : fontSize

	let x = memeWidth / 2
	let y

	if (topText) {
		y = 0
		if (topX) x = parseInt(topX)
		if (topY) y = parseInt(topY)
		this.ctx.textBaseline = 'top'
		wrapText(ctx, topText, x, y, memeWidth, lineHeight, false, topFontSize, fontFamily, topBold, topItalic, topColor)
	}

	if (bottomText) {
		y = memeHeight
		if (bottomX) x = parseInt(bottomX)
		else if (topX) x = memeWidth / 2
		if (bottomY) y = parseInt(bottomY)
		this.ctx.textBaseline = 'bottom'
		wrapText(ctx, bottomText, x, y, memeWidth, lineHeight, true, bottomFontSize, fontFamily, bottomBold, bottomItalic, bottomColor)
	}
}

function buildFont(fontSize, fontFamily, bold, italic) {
	let fontString = `${fontSize}pt ${fontFamily}`

	if(bold) {
		fontString = 'bold ' + fontString
	}

	if(italic) {
		fontString = 'italic ' + fontString
	}

	return fontString;
}

/**
 *
 * @param context
 * @param text
 * @param x
 * @param y
 * @param maxWidth
 * @param lineHeightRatio
 * @param fromBottom
 * @param fontSize
 * @param fontFamily
 * @param bold
 * @param italic
 * @param color
 */
MemeGenerator.prototype.wrapText = function (
	context, text, x, y, maxWidth, lineHeightRatio, fromBottom, fontSize, fontFamily, bold, italic, color) {

	if (!text) {
		return
	}

	context.font = buildFont(fontSize, fontFamily, bold, italic)

	context.fillStyle = color ? color : "#FFFFFF"

	//context.font = `${fontSize}pt ${fontFamily}`

	const pushMethod = fromBottom ? 'unshift' : 'push'
	const lineHeight = lineHeightRatio * fontSize

	let lines = []
	let line = ''
	let words = text.split(' ')

	for (let n = 0; n < words.length; n++) {
		const testLine = line + ' ' + words[n]
		const metrics = context.measureText(testLine)
		const testWidth = metrics.width

		if (testWidth > maxWidth) {
			lines[pushMethod](line)
			line = words[n] + ' '
		} else {
			line = testLine
		}
	}

	lines[pushMethod](line)

	if (lines.length > 2) {
		MemeGenerator.prototype.wrapText(
			context, text, x, y, maxWidth, lineHeightRatio, fromBottom, fontSize - 10, fontFamily)
	} else {
		for (let k in lines) {
			if (fromBottom) {
				context.strokeText(lines[k], x, y - lineHeight * k)
				context.fillText(lines[k], x, y - lineHeight * k)
			} else {
				context.strokeText(lines[k], x, y + lineHeight * k)
				context.fillText(lines[k], x, y + lineHeight * k)
			}
		}
	}
}

module.exports = MemeGenerator;
