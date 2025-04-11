import { useRef } from "react";
import { useAuth } from "../context/AuthContext";
import Layout from "./Layout";
import BackgroundVideo from "../components/BackgroundVideo";
import APropos from "../components/APropos";
import ClaimForm from "../pages/ClaimForm";
import ContactUs from "../components/ContactUs";
import Prelogin from "../components/ChatBot/Prelogin";
import NosServices from "../components/NosServices";

interface HomePageProps {
  extraFeature?: string;
}

const HomePage: React.FC<HomePageProps> = ({ extraFeature }) => {
  const { isLoggedIn } = useAuth();
  const aproposRef = useRef<HTMLDivElement>(null);
  const claimFormRef = useRef<HTMLDivElement>(null);
  const ContactUsRef = useRef<HTMLDivElement>(null);
  const ServicesRef = useRef<HTMLDivElement>(null);

  const scrollToAPropos = () => {
    aproposRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToClaimForm = () => {
    claimFormRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToContactUs = () => {
    ContactUsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToServices = () => {
    ServicesRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <Layout
      scrollToAPropos={scrollToAPropos}
      scrollToClaimForm={scrollToClaimForm}
      scrollToContactUs={scrollToContactUs}
      scrollToServices={scrollToServices}
      isHomePage={true}
    >
      {/* Move all content inside Layout as children */}
      <BackgroundVideo />
      <APropos ref={aproposRef} />
      <NosServices ref={ServicesRef}/>
      {extraFeature && <ClaimForm ref={claimFormRef} />}
      <ContactUs ref={ContactUsRef}/>
      {!isLoggedIn && <Prelogin />}
    </Layout>
  );
};

export default HomePage;