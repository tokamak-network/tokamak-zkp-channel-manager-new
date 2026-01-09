# Wagmi Documentation

> Reactivity for Ethereum apps

Type Safe, Extensible, and Modular by design. Build high-performance blockchain frontends.

**Source**: [Wagmi Documentation](https://wagmi.sh) | [LLMs.txt](https://wagmi.sh/llms.txt)

## Table of Contents

### Introduction

- [Why Wagmi](/react/why.md)
- [Installation](/react/installation.md)
- [Getting Started](/react/getting-started.md)
- [TypeScript](/react/typescript.md)
- [Comparison](/react/comparisons.md)

### Guides

- [TanStack Query](/react/guides/tanstack-query.md)
- [Viem](/react/guides/viem.md)
- [Error Handling](/react/guides/error-handling.md)
- [Ethers.js Adapters](/react/guides/ethers.md)
- [Chain Properties](/react/guides/chain-properties.md)
- [SSR](/react/guides/ssr.md)
- [Connect Wallet](/react/guides/connect-wallet.md)
- [Send Transaction](/react/guides/send-transaction.md)
- [Read from Contract](/react/guides/read-from-contract.md)
- [Write to Contract](/react/guides/write-to-contract.md)
- [FAQ / Troubleshooting](/react/guides/faq.md)
- [Migrate from v2 to v3](/react/guides/migrate-from-v2-to-v3.md): Guide for migrating from Wagmi v2 to v3.
- [Migrate from v1 to v2](/react/guides/migrate-from-v1-to-v2.md): Guide for migrating from Wagmi v1 to v2.

### Configuration

- [createConfig](/react/api/createConfig.md)
- [createStorage](/react/api/createStorage.md)
- [Chains](/react/api/chains.md)
- [Connectors](/react/api/connectors.md)
- [Transports](/react/api/transports.md)
- [WagmiProvider](/react/api/WagmiProvider.md)

#### Connectors

- [baseAccount](/react/api/connectors/baseAccount.md)
- [gemini](/react/api/connectors/gemini.md)
- [injected](/react/api/connectors/injected.md)
- [metaMask](/react/api/connectors/metaMask.md)
- [mock](/react/api/connectors/mock.md)
- [porto](/react/api/connectors/porto.md)
- [safe](/react/api/connectors/safe.md)
- [walletConnect](/react/api/connectors/walletConnect.md)

#### Transports

- [custom](/react/api/transports/custom.md)
- [fallback](/react/api/transports/fallback.md)
- [http](/react/api/transports/http.md)
- [unstable_connector](/react/api/transports/unstable_connector.md)
- [webSocket](/react/api/transports/webSocket.md)

### Hooks

- [useBalance](/react/api/hooks/useBalance.md): Hook for fetching native currency balance.
- [useBlockNumber](/react/api/hooks/useBlockNumber.md): Hook for fetching the number of the most recent block seen.
- [useBlock](/react/api/hooks/useBlock.md): Hook for fetching information about a block at a block number, hash or tag.
- [useBlockTransactionCount](/react/api/hooks/useBlockTransactionCount.md): Hook for fetching the number of Transactions at a block number, hash or tag.
- [useBytecode](/react/api/hooks/useBytecode.md): Hook for retrieving the bytecode at an address.
- [useCall](/react/api/hooks/useCall.md): Hook for executing a new message call immediately without submitting a transaction to the network.
- [useCallsStatus](/react/api/hooks/useCallsStatus.md): Hook for fetching the number of the most recent block seen.
- [useCapabilities](/react/api/hooks/useCapabilities.md): Hook for fetching the number of the most recent block seen.
- [useChainId](/react/api/hooks/useChainId.md): Hook for getting current chain ID.
- [useChains](/react/api/hooks/useChains.md): Hook for getting configured chains
- [useClient](/react/api/hooks/useClient.md): Hook for getting Viem `Client` instance.
- [useConfig](/react/api/hooks/useConfig.md): Hook for getting `Config` from nearest `WagmiProvider`.
- [useConnect](/react/api/hooks/useConnect.md): Hook for connecting accounts with connectors.
- [useConnection](/react/api/hooks/useConnection.md): Hook for getting current connection.
- [useConnectionEffect](/react/api/hooks/useConnectionEffect.md): Hook for listening to connection lifecycle events.
- [useConnections](/react/api/hooks/useConnections.md): Hook for getting active connections.
- [useConnectorClient](/react/api/hooks/useConnectorClient.md): Hook for getting a Viem `Client` object for the current or provided connector.
- [useConnectors](/react/api/hooks/useConnectors.md): Hook for getting configured connectors.
- [useDeployContract](/react/api/hooks/useDeployContract.md): Hook for deploying a contract to the network, given bytecode & constructor arguments.
- [useDisconnect](/react/api/hooks/useDisconnect.md): Hook for disconnecting connections.
- [useEnsAddress](/react/api/hooks/useEnsAddress.md): Hook for fetching ENS address for name.
- [useEnsAvatar](/react/api/hooks/useEnsAvatar.md): Hook for fetching ENS avatar for name.
- [useEnsName](/react/api/hooks/useEnsName.md): Hook for fetching primary ENS name for address.
- [useEnsResolver](/react/api/hooks/useEnsResolver.md): Hook for fetching ENS resolver for name.
- [useEnsText](/react/api/hooks/useEnsText.md): Hook for fetching a text record for a specified ENS name and key.
- [useFeeHistory](/react/api/hooks/useFeeHistory.md): Hook for fetching a collection of historical gas information.
- [useProof](/react/api/hooks/useProof.md): Hook for return the account and storage values of the specified account including the Merkle-proof.
- [usePublicClient](/react/api/hooks/usePublicClient.md): Hook for getting Viem `PublicClient` instance.
- [useEstimateFeesPerGas](/react/api/hooks/useEstimateFeesPerGas.md): Hook for fetching an estimate for the fees per gas (in wei) for a transaction to be likely included in the next block.
- [useEstimateGas](/react/api/hooks/useEstimateGas.md): Hook for estimating the gas necessary to complete a transaction without submitting it to the network.
- [useEstimateMaxPriorityFeePerGas](/react/api/hooks/useEstimateMaxPriorityFeePerGas.md): Hook for fetching an estimate for the max priority fee per gas (in wei) for a transaction to be likely included in the next block.
- [useGasPrice](/react/api/hooks/useGasPrice.md): Hook for fetching the current price of gas (in wei).
- [useInfiniteReadContracts](/react/api/hooks/useInfiniteReadContracts.md): Hook for calling multiple read methods on a contract with "infinite scroll"/"fetch more" support.
- [usePrepareTransactionRequest](/react/api/hooks/usePrepareTransactionRequest.md): Hook for preparing a transaction request for signing by populating a nonce, gas limit, fee values, and a transaction type.
- [useReadContract](/react/api/hooks/useReadContract.md): Hook for calling a read-only function on a contract, and returning the response.
- [useReadContracts](/react/api/hooks/useReadContracts.md): Hook for calling multiple read methods on a contract.
- [useReconnect](/react/api/hooks/useReconnect.md): Hook for reconnecting connectors.
- [useSendCalls](/react/api/hooks/useSendCalls.md): Hook that requests for the wallet to sign and broadcast a batch of calls (transactions) to the network.
- [useSendCallsSync](/react/api/hooks/useSendCallsSync.md): Hook that requests for the wallet to sign and broadcast a batch of calls (transactions) to the network.
- [useSendTransaction](/react/api/hooks/useSendTransaction.md): Hook for creating, signing, and sending transactions to networks.
- [useSendTransactionSync](/react/api/hooks/useSendTransactionSync.md): Hook for creating, signing, and sending transactions to the network synchronously.
- [useShowCallsStatus](/react/api/hooks/useShowCallsStatus.md): Action to request for the wallet to show information about a call batch
- [useSignMessage](/react/api/hooks/useSignMessage.md): Hook for signing messages.
- [useSignTypedData](/react/api/hooks/useSignTypedData.md): Hook for signing typed data and calculating an Ethereum-specific EIP-712 signature.
- [useSimulateContract](/react/api/hooks/useSimulateContract.md): Hook for simulating/validating a contract interaction.
- [useStorageAt](/react/api/hooks/useStorageAt.md): Hook for returning the value from a storage slot at a given address.
- [useSwitchChain](/react/api/hooks/useSwitchChain.md): Hook for switching the target chain for a connector or the Wagmi `Config`.
- [useSwitchConnection](/react/api/hooks/useSwitchConnection.md): Hook for switching the current connection.
- [useTransaction](/react/api/hooks/useTransaction.md): Hook for fetching transactions given hashes or block identifiers.
- [useTransactionConfirmations](/react/api/hooks/useTransactionConfirmations.md): Hook for fetching the number of blocks passed (confirmations) since the transaction was processed on a block.
- [useTransactionCount](/react/api/hooks/useTransactionCount.md): Hook for fetching the number of transactions an Account has broadcast / sent.
- [useTransactionReceipt](/react/api/hooks/useTransactionReceipt.md): Hook for return the Transaction Receipt given a Transaction hash.
- [useWaitForCallsStatus](/react/api/hooks/useWaitForCallsStatus.md): Waits for a call bundle to be confirmed & included on a block.
- [useWaitForTransactionReceipt](/react/api/hooks/useWaitForTransactionReceipt.md): Hook that waits for the transaction to be included on a block, and then returns the transaction receipt. If the transaction reverts, then the action will throw an error. Replacement detection (e.g. sped up transactions) is also supported.
- [useVerifyMessage](/react/api/hooks/useVerifyMessage.md): Hook for verify that a message was signed by the provided address.
- [useVerifyTypedData](/react/api/hooks/useVerifyTypedData.md): Hook for verify that a typed data was signed by the provided address.
- [useWalletClient](/react/api/hooks/useWalletClient.md): Hook for getting a Viem `WalletClient` object for the current or provided connector.
- [useWatchAsset](/react/api/hooks/useWatchAsset.md): Hook for requesting user tracks the token in their wallet. Returns a boolean indicating if the token was successfully added.
- [useWatchBlocks](/react/api/hooks/useWatchBlocks.md): Hook that watches for block changes.
- [useWatchBlockNumber](/react/api/hooks/useWatchBlockNumber.md): Hook that watches for block number changes.
- [useWatchContractEvent](/react/api/hooks/useWatchContractEvent.md): Hook that watches and returns emitted contract event logs.
- [useWatchPendingTransactions](/react/api/hooks/useWatchPendingTransactions.md): Hook that watches and returns pending transaction hashes.
- [useWriteContract](/react/api/hooks/useWriteContract.md): Action for executing a write function on a contract.

### Miscellaneous

- [Actions](/react/api/actions.md)
- [Errors](/react/api/errors.md)

#### Utilities

- [cookieToInitialState](/react/api/utilities/cookieToInitialState.md)
- [deserialize](/react/api/utilities/deserialize.md)
- [serialize](/react/api/utilities/serialize.md)

---

**Source**: [Wagmi Documentation](https://wagmi.sh)
