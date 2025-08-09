import { CPSTest } from "@/components/CPSTest";
import { useEffect } from "react";

const Index = () => {
  useEffect(() => {
    // SEO optimization
    document.title = "CPS Test - Clicks Per Second Test Online | Free Click Speed Test";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Test your clicking speed with our free CPS test. Measure your clicks per second with multiple time modes. Improve your click speed and compete with yourself!');
    }
  }, []);

  return <CPSTest />;
};

export default Index;
