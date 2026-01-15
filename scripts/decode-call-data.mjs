/**
 * Decode submitProofAndSignature call data
 */

const { decodeFunctionData } = require('viem');

const callData = "0xab608eca97d35a8b3b938afa65d8305a201a254b609c0697fbbb63ad6bf7eacd3461dde600000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000005600000000000000000000000000000000000000000000000000000000000000ac000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000bca973823a483c75abd8c2acfb82856000000000000000000000000000000000fdbda48954f8a3433a04086cb4ab9a8000000000000000000000000000000000f2198d3ee1274c575dec9d60106c6fe0000000000000000000000000000000010206625cce15f1438d0a92b4824f07900000000000000000000000000000000127960201fc8326d3d7cd4d91589a24a00000000000000000000000000000000151815cdda55f0298d331c1a2fa5ae8a0000000000000000000000000000000015c227908412f63c9361b363513ac71900000000000000000000000000000000094ae7d14cce868db5b5847291a52ab0000000000000000000000000000000000a15a9869d937a2054678d936cd233e2000000000000000000000000000000000f6279d9f6b411f53ecf6e87b045f0730000000000000000000000000000000015737f53d1ebd033b5bf43790f552b870000000000000000000000000000000001c7f055d9a12b91c5f38ffa401460ec00000000000000000000000000000000145e4e76951321ffabdb425d055aa22d00000000000000000000000000000000089ee877251687a14088609e38850efb0000000000000000000000000000000009ed02586aa778e406e5a0413b38ba5c000000000000000000000000000000000f9c1cb72190221d7b84258d5a77224e000000000000000000000000000000000c8e6858eb258af55c34ae5e92e63c50000000000000000000000000000000000d750b0cf673f38fe689eeac151ea5e2000000000000000000000000000000000883350967ab884b1291c4ab613531710000000000000000000000000000000011adad1dca619909a722c401dbd88cfc000000000000000000000000000000000b23e6eee5f5b056393d0362aaef0134000000000000000000000000000000001477e66afa6796521ae6f95fcd390b490000000000000000000000000000000008c658c88b8dd42d56573f610480c1d3000000000000000000000000000000000e4d761f29f7d781fd1d7344831cbddb00000000000000000000000000000000166d4233b51de98947efa2b97c6dc06d000000000000000000000000000000000fc6919d6c69bbc6dd30ee5bcd9a61a8000000000000000000000000000000000a3faab8927e086cffd3127eaf4a6d0f000000000000000000000000000000000976f743ebbc380e4a7fd935cdceee6100000000000000000000000000000000065e9e70f7eb28d5f0f67cae8836f68e0000000000000000000000000000000014a7286a847d1ccdc0039a55436b25d5000000000000000000000000000000000ac3a4c2bf0c4e7aee8c8a5361882d6f00000000000000000000000000000000189ec3dfd050c1abb7e4993783ad45ac00000000000000000000000000000000065e9e70f7eb28d5f0f67cae8836f68e0000000000000000000000000000000014a7286a847d1ccdc0039a55436b25d50000000000000000000000000000000018662e5997a406a4acf48bce7bea5deb00000000000000000000000000000000093187a5364ecaf7f837501c45bdb3d0000000000000000000000000000000000bf04ce2fbc8efb8c70753761577e23d00000000000000000000000000000000179456d64f0a9262c5fea91285ef98c5000000000000000000000000000000000000000000000000000000000000002aa75ca989f6649f4782723ea5c3d492c42d49da07638327468dc26e42b3c79f68cdd5454f27f7f8188508ee2f3978312e61ebfe34ddb690e7433183049e8b0a5fa21b5f2d7a600912a15409e61b832201d6c46cdd23f6c1e8c97ade8321d436d68431b38b8cb5d8e48db2829b24e961a37a677fe621ee1b7e0adb1d8bac2faf0f8c4544fca9bb920f5ba7aedda4c10000244a506be2ff2bd362b41b39509cbfd8ec58034778ce6b3f260150630dd82d8e5fd5c81d5cecab7671a7ebdd4de7eb9ac8d49107f66dc9493362fe6eff4dbaa99cd361390160c46eaee9da0e35eb7e02b71857c0793afd3843b056155f97db89c38b045712be88aefe5166f60296ee21fd837da53b936fa7fd7799b3144a57f367faa7c9da75e30b0bc28cf69f2194f7ce11d67a6672d51be39af5f98c6b8d341cf7b8a2df6447f1186f340d1d8de554c9dc797dd0878fbb1b79e5fe8cd1b5c6f94f9202a47b43fe8706349a62dd203b4953d5d6eee7655528759d23d6566e91655d67b99e1c56d081f17a38e60c822b5004a245a230e082a9c31fa450cc7ba3bd3e6c521bec885a426f86a9efc135e86f59009f2829e69c13becb87f5ccf512a873b1d7e3df6717208adef15a64a5833dcc96d8cda506c30a5dc32816c2c8f18d24b856ae503e45392c9193d55b34428221e3623199d7ea4b3ca18c2f2cba980b0b66caf5511413b696f82c21ea30e1265b8596b644b1b06d05fa8a116ca900da593b266913d8f855556e38791465ad88feb8c531ded2a3cf2d07bf9ecdfd1f9c43d1846a4efb4846aebe919be4bfc633acd6174ebc20ad3b225f838db72e84b9d11c8def71546d1525ad5054fcbfba32ab2bd4e9fc5c5238fc07483a3a14f8f9aca2c04f966320ba53e270516117f2feef54e6cf2f668a970d1f22fdb82796fb25f9dbd7e4f124d623fc7bece30c5997962b5329c84a94e9bb9cb4ea26a401937e140925ee2ec1a7cdc06d8955ae7ee0d98da594aeefa0eb944f48f318b68acc3d415cb6e146ee8421af590f12819f1beb0a26c856339a80fe56a";

const submitProofAndSignatureAbi = [
  {
    name: "submitProofAndSignature",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "channelId",
        type: "bytes32",
        internalType: "bytes32"
      },
      {
        name: "proofs",
        type: "tuple[]",
        internalType: "struct BridgeProofManager.ProofData[]",
        components: [
          {
            name: "proofPart1",
            type: "uint128[]",
            internalType: "uint128[]"
          },
          {
            name: "proofPart2",
            type: "uint256[]",
            internalType: "uint256[]"
          },
          {
            name: "publicInputs",
            type: "uint256[]",
            internalType: "uint256[]"
          },
          {
            name: "smax",
            type: "uint256",
            internalType: "uint256"
          }
        ]
      },
      {
        name: "signature",
        type: "tuple",
        internalType: "struct BridgeProofManager.Signature",
        components: [
          {
            name: "message",
            type: "bytes32",
            internalType: "bytes32"
          },
          {
            name: "rx",
            type: "uint256",
            internalType: "uint256"
          },
          {
            name: "ry",
            type: "uint256",
            internalType: "uint256"
          },
          {
            name: "z",
            type: "uint256",
            internalType: "uint256"
          }
        ]
      }
    ],
    outputs: []
  }
];

try {
  const decoded = decodeFunctionData({
    abi: submitProofAndSignatureAbi,
    data: callData,
  });

  console.log("=".repeat(80));
  console.log("DECODED CALL DATA");
  console.log("=".repeat(80));
  console.log("\nFunction Name:", decoded.functionName);
  console.log("\n[Arg 0] channelId (bytes32):");
  console.log("  Value:", decoded.args[0]);
  console.log("  Hex:", decoded.args[0]);

  console.log("\n[Arg 1] proofs (ProofData[]):");
  console.log("  Length:", decoded.args[1].length);
  
  decoded.args[1].forEach((proof, index) => {
    console.log(`\n  Proof ${index + 1}:`);
    console.log(`    proofPart1: [${proof.proofPart1.length} elements]`);
    console.log(`      First 3: ${proof.proofPart1.slice(0, 3).map(v => v.toString()).join(", ")}`);
    console.log(`    proofPart2: [${proof.proofPart2.length} elements]`);
    console.log(`      First 3: ${proof.proofPart2.slice(0, 3).map(v => v.toString()).join(", ")}`);
    console.log(`    publicInputs: [${proof.publicInputs.length} elements]`);
    console.log(`      First 5: ${proof.publicInputs.slice(0, 5).map(v => v.toString()).join(", ")}`);
    console.log(`      Indices 8-9: ${proof.publicInputs[8]?.toString()}, ${proof.publicInputs[9]?.toString()}`);
    console.log(`    smax: ${proof.smax.toString()}`);
  });

  console.log("\n[Arg 2] signature (Signature):");
  console.log("  message:", decoded.args[2].message);
  console.log("  rx:", decoded.args[2].rx.toString());
  console.log("  ry:", decoded.args[2].ry.toString());
  console.log("  z:", decoded.args[2].z.toString());

  console.log("\n" + "=".repeat(80));
  console.log("FULL DECODED ARGS (JSON):");
  console.log("=".repeat(80));
  console.log(JSON.stringify({
    channelId: decoded.args[0],
    proofs: decoded.args[1].map(proof => ({
      proofPart1: proof.proofPart1.map(v => v.toString()),
      proofPart2: proof.proofPart2.map(v => v.toString()),
      publicInputs: proof.publicInputs.map(v => v.toString()),
      smax: proof.smax.toString(),
    })),
    signature: {
      message: decoded.args[2].message,
      rx: decoded.args[2].rx.toString(),
      ry: decoded.args[2].ry.toString(),
      z: decoded.args[2].z.toString(),
    }
  }, null, 2));

} catch (error) {
  console.error("Failed to decode call data:", error);
  process.exit(1);
}
