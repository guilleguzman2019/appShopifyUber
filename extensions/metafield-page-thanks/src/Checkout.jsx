import {
  reactExtension,
  Banner,
  useApi,
  BlockStack,
  Spinner,
  Text,
} from '@shopify/ui-extensions-react/checkout';
import { useEffect, useState } from 'react';

function Extension() {

  const { orderConfirmation, query } = useApi();
  const [metafields, setMetafields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Obtener el ID de la orden
  const rawOrderId = orderConfirmation?.current?.order?.id;

  console.log(rawOrderId);

  const {shop} = useApi();
  
  useEffect(() => {


  }, [shop]);

  if (!rawOrderId) {
    return null;
  }

  return (
    <BlockStack>
      <Banner>
        Order ID : {rawOrderId}
      </Banner>

      
    </BlockStack>
  );
}

export default reactExtension('purchase.thank-you.block.render', () => <Extension />);