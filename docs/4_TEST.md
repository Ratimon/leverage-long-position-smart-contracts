# 🎲 Debugging using TDD

### 🧪 Command

- one using [dapptools](https://dapp.tools)

```bash
dapp test
```

it requires additional step to set up your machine:

Install dapptools (Following instruction [here](https://github.com/dapphub/dapptools#installation)):

```bash
# user must be in sudoers
curl -L -o install-nix https://releases.nixos.org/nix/nix-2.3.16/install

sh install-nix --darwin-use-unencrypted-nix-store-volume

# Run this or login again to use Nix
. "$HOME/.nix-profile/etc/profile.d/nix.sh"

curl https://dapp.tools/install | sh
```

Then install solc with the correct version:

```bash
nix-env -f https://github.com/dapphub/dapptools/archive/master.tar.gz -iA solc-static-versions.solc_0_8_10
```

- And another using hardhat that can leverage hardhat-deploy to reuse deployment procedures and named accounts:

```bash
yarn test
```

```bash
yarn fork:test <network> [--blockNumber <blockNumber>] [mocha args...]
```

Note that , for binance smart chain we use **network** name as `bscmainnetfork`

```bash
yarn fork:test bscmainnetfork [--blockNumber <blockNumber>]
```

This will test the contract against a temporary fork of the specified network.
<br/><br/>

These will execute your tests using mocha. you can pass extra arguments to mocha
<br/><br/>

```bash
yarn coverage
```

These will produce a coverage report in the `coverage/` folder
<br/><br/>

```bash
yarn gas
```

These will produce a gas report for function used in the tests
<br/><br/>

### 🧪 Tips

It is recommended to run unit and isolation tests in isolation by simply using `.skip()`

```typescript
describe.skip();
```

To utilize the maximum benefit of debugging features, use:

```
yarn hardhat test --logs
```

> :warning: **Warning**

> we can add the --logs after your test command. So, this could emit Event during TDD environment
