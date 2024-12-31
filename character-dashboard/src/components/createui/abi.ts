export const abi = [
	{
		type: "constructor",
		inputs: [
			{
				name: "_pTokenAddress",
				type: "address",
				internalType: "address",
			},
		],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "INITIAL_PRICE",
		inputs: [],
		outputs: [
			{
				name: "",
				type: "uint256",
				internalType: "uint256",
			},
		],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "K",
		inputs: [],
		outputs: [
			{
				name: "",
				type: "uint256",
				internalType: "uint256",
			},
		],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "addressToMemeTokenMapping",
		inputs: [
			{
				name: "",
				type: "address",
				internalType: "address",
			},
		],
		outputs: [
			{
				name: "name",
				type: "string",
				internalType: "string",
			},
			{
				name: "symbol",
				type: "string",
				internalType: "string",
			},
			{
				name: "description",
				type: "string",
				internalType: "string",
			},
			{
				name: "tokenImageUrl",
				type: "string",
				internalType: "string",
			},
			{
				name: "fundingRaised",
				type: "uint256",
				internalType: "uint256",
			},
			{
				name: "tokenAddress",
				type: "address",
				internalType: "address",
			},
			{
				name: "creatorAddress",
				type: "address",
				internalType: "address",
			},
		],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "buyMemeToken",
		inputs: [
			{
				name: "memeTokenAddress",
				type: "address",
				internalType: "address",
			},
			{
				name: "tokenQty",
				type: "uint256",
				internalType: "uint256",
			},
		],
		outputs: [
			{
				name: "",
				type: "uint256",
				internalType: "uint256",
			},
		],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "calculateCost",
		inputs: [
			{
				name: "currentSupply",
				type: "uint256",
				internalType: "uint256",
			},
			{
				name: "tokensToBuy",
				type: "uint256",
				internalType: "uint256",
			},
		],
		outputs: [
			{
				name: "",
				type: "uint256",
				internalType: "uint256",
			},
		],
		stateMutability: "pure",
	},
	{
		type: "function",
		name: "calculateSellReturn",
		inputs: [
			{
				name: "memeTokenAddress",
				type: "address",
				internalType: "address",
			},
			{
				name: "tokenQty",
				type: "uint256",
				internalType: "uint256",
			},
		],
		outputs: [
			{
				name: "",
				type: "uint256",
				internalType: "uint256",
			},
		],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "createMemeToken",
		inputs: [
			{
				name: "name",
				type: "string",
				internalType: "string",
			},
			{
				name: "symbol",
				type: "string",
				internalType: "string",
			},
			{
				name: "imageUrl",
				type: "string",
				internalType: "string",
			},
			{
				name: "description",
				type: "string",
				internalType: "string",
			},
		],
		outputs: [
			{
				name: "",
				type: "address",
				internalType: "address",
			},
		],
		stateMutability: "payable",
	},
	{
		type: "function",
		name: "getAllMemeTokens",
		inputs: [],
		outputs: [
			{
				name: "",
				type: "tuple[]",
				internalType: "struct TokenFactory.memeToken[]",
				components: [
					{
						name: "name",
						type: "string",
						internalType: "string",
					},
					{
						name: "symbol",
						type: "string",
						internalType: "string",
					},
					{
						name: "description",
						type: "string",
						internalType: "string",
					},
					{
						name: "tokenImageUrl",
						type: "string",
						internalType: "string",
					},
					{
						name: "fundingRaised",
						type: "uint256",
						internalType: "uint256",
					},
					{
						name: "tokenAddress",
						type: "address",
						internalType: "address",
					},
					{
						name: "creatorAddress",
						type: "address",
						internalType: "address",
					},
				],
			},
		],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "memeTokenAddresses",
		inputs: [
			{
				name: "",
				type: "uint256",
				internalType: "uint256",
			},
		],
		outputs: [
			{
				name: "",
				type: "address",
				internalType: "address",
			},
		],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "owner",
		inputs: [],
		outputs: [
			{
				name: "",
				type: "address",
				internalType: "address",
			},
		],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "pTokenAddress",
		inputs: [],
		outputs: [
			{
				name: "",
				type: "address",
				internalType: "address",
			},
		],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "renounceOwnership",
		inputs: [],
		outputs: [],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "sellMemeToken",
		inputs: [
			{
				name: "memeTokenAddress",
				type: "address",
				internalType: "address",
			},
			{
				name: "tokenQty",
				type: "uint256",
				internalType: "uint256",
			},
		],
		outputs: [
			{
				name: "",
				type: "uint256",
				internalType: "uint256",
			},
		],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "transferOwnership",
		inputs: [
			{
				name: "newOwner",
				type: "address",
				internalType: "address",
			},
		],
		outputs: [],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "withdrawPTOKEN",
		inputs: [],
		outputs: [],
		stateMutability: "nonpayable",
	},
	{
		type: "event",
		name: "OwnershipTransferred",
		inputs: [
			{
				name: "previousOwner",
				type: "address",
				indexed: true,
				internalType: "address",
			},
			{
				name: "newOwner",
				type: "address",
				indexed: true,
				internalType: "address",
			},
		],
		anonymous: false,
	},
	{
		type: "event",
		name: "TokensSold",
		inputs: [
			{
				name: "seller",
				type: "address",
				indexed: true,
				internalType: "address",
			},
			{
				name: "tokenAddress",
				type: "address",
				indexed: true,
				internalType: "address",
			},
			{
				name: "amount",
				type: "uint256",
				indexed: false,
				internalType: "uint256",
			},
			{
				name: "pTokenReceived",
				type: "uint256",
				indexed: false,
				internalType: "uint256",
			},
		],
		anonymous: false,
	},
	{
		type: "error",
		name: "OwnableInvalidOwner",
		inputs: [
			{
				name: "owner",
				type: "address",
				internalType: "address",
			},
		],
	},
	{
		type: "error",
		name: "OwnableUnauthorizedAccount",
		inputs: [
			{
				name: "account",
				type: "address",
				internalType: "address",
			},
		],
	},
];
