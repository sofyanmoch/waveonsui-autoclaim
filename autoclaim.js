import fetch from "node-fetch";
import { Buffer } from "buffer";
import fs from "fs";
import { getFullnodeUrl, SuiClient } from "@mysten/sui.js/client";
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { bcs } from "@mysten/bcs";
import chalk from "chalk";
// import readlineSync from "readline-sync";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const gettimeclaim = (address) =>
  new Promise((resolve, reject) => {
    fetch("https://fullnode.mainnet.sui.io/", {
      method: "POST",
      headers: {
        accept: "*/*",
        "accept-language": "en-GB,en;q=0.9,en-US;q=0.8",
        "client-sdk-type": "typescript",
        "client-sdk-version": "0.51.0",
        "client-target-api-version": "1.21.0",
        "content-type": "application/json",
        origin: "https://walletapp.waveonsui.com",
        priority: "u=1, i",
        referer: "https://walletapp.waveonsui.com/",
        "sec-ch-ua":
          '"Chromium";v="124", "Microsoft Edge";v="124", "Not-A.Brand";v="99", "Microsoft Edge WebView2";v="124"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "cross-site",
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 45,
        method: "suix_getDynamicFieldObject",
        params: [
          "0x4846a1f1030deffd9dea59016402d832588cf7e0c27b9e4c1a63d2b5e152873a",
          {
            type: "address",
            value: address,
          },
        ],
      }),
    })
      .then((res) => res.json())
      .then((res) => resolve(res))
      .catch((err) => reject(err));
  });

const claimReward = (keypair, address, client) => {
  return new Promise((resolve, reject) => {
    gettimeclaim(address)
      .then((waktu) => {
        waktu = waktu.result.data.content.fields.last_claim;
        waktu = waktu.toString();

        let time = Date.now().toString();
        const msto = time - waktu;

        if (msto > 7200000) {
          const packageObjectId =
            "0x1efaf509c9b7e986ee724596f526a22b474b15c376136772c00b8452f204d2d1";
          const tx = new TransactionBlock();
          tx.moveCall({
            target: `${packageObjectId}::game::claim`,
            arguments: [
              tx.object(
                "0x4846a1f1030deffd9dea59016402d832588cf7e0c27b9e4c1a63d2b5e152873a"
              ),
              tx.pure(
                "0x0000000000000000000000000000000000000000000000000000000000000006"
              ),
            ],
          });
          client.signAndExecuteTransactionBlock({
            signer: keypair,
            transactionBlock: tx,
          })
          .then(result => {
            console.log(
              chalk.green(
                `Sukses Claim => https://suiscan.xyz/mainnet/tx/${result.digest}`
              )
            );
            resolve(`https://suiscan.xyz/mainnet/tx/${result.digest}`);
          })
          .catch(err => reject(err));
        } else {
          console.log(chalk.red("Belum Waktunya Claim"));
          resolve(null);
        }
      })
      .catch(err => reject(err));
  });
};

const main = async () => {
  const file = fs.readFileSync("phrase.txt", "utf-8");
  const splitFile = file.split("\n");

  for (let i = 0; i < splitFile.length; i++) {
    console.log(
      "============================================================================"
    );
    const keypair = Ed25519Keypair.deriveKeypair(splitFile[i]);
    const address = keypair.getPublicKey().toSuiAddress();
    console.log("Address : " + address);
    const client = new SuiClient({
      url: "https://fullnode.mainnet.sui.io",
    });

     await claimReward(keypair, address, client);

    console.log(
      "============================================================================"
    );
  }
};

setInterval(() => {
  main()
}, 1920000) // set waktu delay


main()
