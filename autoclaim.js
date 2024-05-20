import fetch from 'node-fetch';
import fs from 'fs';
import { getFullnodeUrl, SuiClient } from '@mysten/sui.js/client';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import chalk from "chalk";

const getTimeClaim = (address) => new Promise((resolve, reject) => { 
    fetch('https://fullnode.mainnet.sui.io/', {
        method: 'POST',
        headers: {
            'accept': '*/*',
            'accept-language': 'en-GB,en;q=0.9,en-US;q=0.8',
            'client-sdk-type': 'typescript',
            'client-sdk-version': '0.51.0',
            'client-target-api-version': '1.21.0',
            'content-type': 'application/json',
            'origin': 'https://walletapp.waveonsui.com',
            'priority': 'u=1, i',
            'referer': 'https://walletapp.waveonsui.com/',
            'sec-ch-ua': '"Chromium";v="124", "Microsoft Edge";v="124", "Not-A.Brand";v="99", "Microsoft Edge WebView2";v="124"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'cross-site',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0'
        },
        body: JSON.stringify({
            'jsonrpc': '2.0',
            'id': 45,
            'method': 'suix_getDynamicFieldObject',
            'params': [
                '0x4846a1f1030deffd9dea59016402d832588cf7e0c27b9e4c1a63d2b5e152873a',
                {
                    'type': 'address',
                    'value': address
                }
            ]
        })
    })
    .then(async res => {
        if (!res.ok) {
            const errorResponse = await res.json();
            reject(new Error(`API Error: ${errorResponse.error.message}`));
        } else {
            return res.json();
        }
    })
    .then(res => {
        resolve(res);
    })
    .catch(err => reject(err));
});

const claiming = async () => {
    console.log('===== Start Claiming =====')
    var file = fs.readFileSync('phrase.txt', 'utf-8');
    var splitFile = file.split('\r\n');
    console.clear();
    for (let i = 0; i < splitFile.length; i++) {
        console.log("============================================================================");
        const keypair = Ed25519Keypair.deriveKeypair(splitFile[i]);
        const address = keypair.getPublicKey().toSuiAddress();
        console.log("Address : " + address);
        const client = new SuiClient({
            url: "https://fullnode.mainnet.sui.io",
        });
        let timeClaim;
        try {
            timeClaim = await getTimeClaim(address);
            timeClaim = timeClaim.result.data.content.fields.last_claim;
            timeClaim = timeClaim.toString();
            //console.log(timeClaim)
            let currentTime;
            currentTime = Date.now();
            currentTime = currentTime.toString();
            //console.log(currentTime)
            const timeDifference = currentTime - timeClaim;
            //console.log(timeDifference)
            if (timeDifference > 7200000) {

                const packageObjectId = '0x1efaf509c9b7e986ee724596f526a22b474b15c376136772c00b8452f204d2d1';
                const tx = new TransactionBlock();
                tx.moveCall({
                    target: `${packageObjectId}::game::claim`,
                    arguments: [tx.object("0x4846a1f1030deffd9dea59016402d832588cf7e0c27b9e4c1a63d2b5e152873a"),
                    tx.pure('0x0000000000000000000000000000000000000000000000000000000000000006'),
                    ],
                });
                const result = await client.signAndExecuteTransactionBlock({
                    signer: keypair,
                    transactionBlock: tx,
                });
                const txResult = { result };
                console.log(chalk.green(`Successful Claim => https://suiscan.xyz/mainnet/tx/${txResult.result.digest}`));

            } else {
                console.log(chalk.red("Not Time to Claim Yet", new Date()));
                console.log('Next claim attempt: 30 minutes...')
            }
        } catch (error) {
            console.error(chalk.red(`Error: ${error.message}`));
        }
    }
    console.log("============================================================================");
}

// Run the main function every 30 minutes
setInterval(() => {
    console.log('Claiming', new Date().toLocaleString());
    claiming()
}, 1800000);

claiming()
