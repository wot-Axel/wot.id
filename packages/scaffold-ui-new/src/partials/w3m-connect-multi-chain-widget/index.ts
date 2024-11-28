import type { Connector } from '@reown/appkit-core'
import {
  AssetUtil,
  ChainController,
  ConnectorController,
  RouterController
} from '@reown/appkit-core'
import { customElement } from '@reown/appkit-ui'
import { LitElement, html } from 'lit'
import { state } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'

@customElement('w3m-connect-multi-chain-widget')
export class W3mConnectMultiChainWidget extends LitElement {
  // -- Members ------------------------------------------- //
  private unsubscribe: (() => void)[] = []

  // -- State & Properties -------------------------------- //
  @state() private connectors = ConnectorController.state.connectors

  public constructor() {
    super()
    this.unsubscribe.push(
      ConnectorController.subscribeKey('connectors', val => (this.connectors = val))
    )
  }

  public override disconnectedCallback() {
    this.unsubscribe.forEach(unsubscribe => unsubscribe())
  }

  // -- Render -------------------------------------------- //
  public override render() {
    const multiChainConnectors = this.connectors.filter(
      connector => connector.type === 'MULTI_CHAIN' && connector.name !== 'WalletConnect'
    )

    if (!multiChainConnectors?.length) {
      this.style.cssText = `display: none`

      return null
    }

    return html`
      ${multiChainConnectors.map(
        connector => html`
          <wui-list-select-wallet
            imageSrc=${ifDefined(AssetUtil.getConnectorImage(connector))}
            name=${connector.name ?? 'Unknown'}
            tagLabel="MULTICHAIN"
            tagVariant="info"
            variant="primary"
            @click=${() => this.onConnector(connector)}
          ></wui-list-select-wallet>
        `
      )}
    `
  }

  // -- Private Methods ----------------------------------- //
  private onConnector(connector: Connector) {
    ChainController.setActiveConnector(connector)
    RouterController.push('ConnectingMultiChain')
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'w3m-connect-multi-chain-widget': W3mConnectMultiChainWidget
  }
}
