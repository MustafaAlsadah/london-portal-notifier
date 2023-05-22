require('dotenv').config({path: __dirname + '/process.env'});
const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const HOUR = (60*60*1000);

// const express = require('express');

// const app = express();  

// app.listen(3000, () => console.log('Server ready'))
async function checkOpportunities(oldValue){
	const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
    // const browser = await puppeteer.connect({ browserWSEndpoint: 'wss://chrome.browserless.io/' }); 

	const page = await browser.newPage();
	await page.goto('https://c-p.to/misk-foundation/signin', {
        waitUntil: 'networkidle0', timeout: 0
    });
    await page.waitForTimeout(5000);

    const pressButton = async (selector)=>{
        await page.waitForSelector(selector);
        await page.click(selector);
    }

    const emailInput = await page.$('input[name="email"]');
    const passwordInput = await page.$('input[name="password"]');
    
    await emailInput.type("YOUR_CP_EMAIL"); //TODO
    await passwordInput.type("YOUR_CP_PASSWORD"); //TODO        

    await pressButton('button[type="submit"]'); 
    await page.waitForTimeout(5000);     

    await pressButton("button.css-xi65gd");   
    await page.waitForTimeout(5000);     

    await page.screenshot({     
        path: 'example.png', 
        fullPage: true,
    });  

    const opportuniesList = await page.$$(".grid.gap-3");
    let newNumber = opportuniesList.length;
    if(oldValue == newNumber){
        await browser.close();
        return [0, opportuniesList.length, opportuniesList[opportuniesList.length-1]];
    }else if(oldValue < newNumber){
        await browser.close();
        return [1, opportuniesList.length, opportuniesList[opportuniesList.length-1]];
    }else{
        await browser.close();
        return [-1, opportuniesList.length, opportuniesList[opportuniesList.length-1]];
    }
};   

const fs = require('fs');
const qrcode = require('qrcode-terminal');
const SESSION_FILE_PATH = './session.json';

let sessionData;
if(fs.existsSync(SESSION_FILE_PATH)) {
    sessionData = require(SESSION_FILE_PATH);
}
const { Client, LocalAuth } = require('whatsapp-web.js'); 
const client = new Client({
    puppeteer: {
        headless: true,
		args: ['--no-sandbox'],
	}
});



client.on('qr', (qr) => {
    console.log("m1-inside");
    qrcode.generate(qr, {small: true});
    console.log("m1-inside");
});

let i=0;
client.on('ready', async() => {
    try{
        const [value, newLength, lastInList] = await checkOpportunities(20)
        let oldNumber = newLength;
        console.log('Client is ready!');
        const chats = await client.getChats() 
        const myGroup = chats.find(chat => chat.name === '🤖 London Opportunities Bot');
        // await client.sendMessage(myGroup.id._serialized, 'Hello world!');
    
            setTimeout(async () => {
                const [value, newLength, lastInList] = await checkOpportunities(oldNumber)
                console.log(value, "before");
                let message = "";
                if(value===1){
                    message = "🔴🇬🇧 London 🤩\n\n A New opportunnity has been added to the portal! \nWish you good luck😃";
                    await client.sendMessage(myGroup.id._serialized, message);
                }else if(value===-1){
                    message = "🔵🇬🇧 London 🙃\n\n An opportunnity has been removed from the portal.";
                    await client.sendMessage(myGroup.id._serialized, message);
                }
                oldNumber = newLength;
                i++;
                // let name = await lastInList.getProperty("children")[0] 
                // name = await name.getProperty("innerText");

                console.log(`finished itertion ${i}\n\nlast in list: ${lastInList.toString()}`);
            }
            , 1000);
    
            setInterval(async () => {
                const [value, newLength, lastInList] = await checkOpportunities(oldNumber)
                console.log(value, "before");
                let message = "";
                if(value===1){
                    message = "🔴🇬🇧 London 🤩\n\n A New opportunnity has been added to the portal! \nWish you good luck😃";
                    await client.sendMessage(myGroup.id._serialized, message);
                }
                // else if(value===-1){
                //     message = "🔵🇬🇧 London 🙃\n\n An opportunnity has been removed from the portal.";
                //     await client.sendMessage(myGroup.id._serialized, message);
                // }
                oldNumber = newLength;
                i++;
                console.log(`finished itertion ${i}`);
            }
            , HOUR/4);
    }catch(err){
        console.log(err);
        const chats = await client.getChats();
        const myChat = chats.find(chat => chat.name === 'My space');
        await client.sendMessage(myChat.id._serialized, err.message);
        throw Error(err.message);
    }
}); 

client.initialize();
  