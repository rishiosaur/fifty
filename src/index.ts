import { signing_secret, token, name } from './config'
import { App, ExpressReceiver } from '@slack/bolt'
import { gql, request } from 'graphql-request'
import { blocksAndText, postMessageCurry } from './functions'
import axios from 'axios'

function sleep(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms)
	})
}
var bodyParser = require('body-parser')

// create application/json parser
var jsonParser = bodyParser.json()

// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false })

export const receiver = new ExpressReceiver({
	signingSecret: signing_secret,
	endpoints: '/hn/events',
})
export const app = new App({
	signingSecret: signing_secret,
	token: token,
	receiver,
})
receiver.router.post('/hn', jsonParser, async (req, res) => {
	const {
		body: { type, id },
	} = req.body
	const query = gql`
		query Payment($payment: String!) {
			transaction(id: $payment) {
				id
				validated
				from {
					id
				}

				balance
			}
		}
	`

	const { transaction } = await request('http://localhost:3000', query, {
		payment: id,
	})

	console.log(transaction)

	const pm = postMessageCurry(transaction.from.id)

	const pmText = (x: string) => pm(...blocksAndText(x))

	if (transaction.balance > 5) {
		await pmText(
			`Wow, that's very generous of you: you've given me *${transaction.balance}* HN! I like that. Let me think of a compliment for your kind soul :thonk:`
		)
		await sleep(500)
		await pmText(':think:')
		await sleep(500)
		await pmText(':thunj:')
		await sleep(500)
		await pmText(':blobhyperthink:')

		const {
			data: { compliment },
		} = await axios.get('https://complimentr.com/api')

		await pmText(`> ${compliment}`)

		await sleep(200)

		const { data } = await axios.get(
			'https://v2.jokeapi.dev/joke/Programming,Pun?blacklistFlags=nsfw,religious,political,racist,sexist,explicit'
		)

		if (!data.error) {
			await pmText(
				"In fact... I like your generosity so much that I'll throw in a free joke for ya! :sparkles:"
			)
			await sleep(300)

			if (data.joke) {
				await pmText(`*${data.joke}*`)
			} else {
				await pmText(`*${data.setup}*`)
				await sleep(2000)
				await pmText(`*${data.delivery}*`)
			}
		}

		await pmText(
			`Feel free to gimme more monies anytime for a compliment or an insult, <@${transaction.from.id}>!`
		)
	} else if (transaction.balance < 5) {
		await pmText(
			`Wow, less than 5 HN?! How stingy _are_ you??? This calls for drastic action. \n\n<@${transaction.from.id}>, you must receive an insult (I will warn you, though: this bot was made by a Canadian, so the insults might be pretty weak :/)`
		)
		const { data } = await axios.get(
			`https://insults.tr00st.co.uk/phrases/so/action_and_target/?target=<@${transaction.from.id}>&pronoun=they`
		)
		console.log(data)
		await pmText(':angrycry:')
		await sleep(1000)
		await pmText(':angry-dino:')
		await sleep(400)
		await pmText(`> ${data}`)
		await sleep(300)
		await pmText(
			`Feel free to gimme more monies anytime for a compliment, a joke, or an insult, <@${transaction.from.id}>!`
		)
	} else {
		await pmText(
			`OOOOOOOOOO 5HN! That's the magic number :eyes:\n\nLet me think of a joke or a compliment...`
		)
		await sleep(500)
		await pmText(':think:')
		await sleep(500)
		await pmText(':thunj:')
		await sleep(500)
		await pmText(':blobhyperthink:')
		if (Math.random() < 0.5) {
			await pmText(
				`I'm feeling particularly nasty right now; here's an insult for you.`
			)
			const { data } = await axios.get(
				`https://insults.tr00st.co.uk/phrases/so/action_and_target/?target=<@${transaction.from.id}>&pronoun=they`
			)
			console.log(data)
			await pmText(':angrycry:')
			await sleep(1000)
			await pmText(':angry-dino:')
			await sleep(400)
			await pmText(`> ${data}`)
			await sleep(300)
			await pmText(
				`Feel free to gimme more monies anytime for a compliment, a joke, or an insult, <@${transaction.from.id}>!`
			)
		} else {
			await pmText(
				`Y'know what? I'm feeling pretty good right now! Here's a compliment for you :D`
			)

			const {
				data: { compliment },
			} = await axios.get('https://complimentr.com/api')

			await pmText(`> ${compliment}`)

			await sleep(200)

			await pmText(
				`Feel free to gimme more monies anytime for a compliment, a joke, or an insult, <@${transaction.from.id}>!`
			)
		}
	}

	res.end('200')
})
;(async () => {
	// Start your app
	await app.start(process.env.PORT || 5555)

	console.log(`${name} is running! 🔥`)

	// for (const [feature, handler] of Object.entries(features)) {
	// 	handler(app)
	// 	console.log(`Feature "${feature}" has been loaded.`)
	// }
})()
