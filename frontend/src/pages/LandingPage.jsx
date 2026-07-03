import HeroSection from "@/components/site/HeroSection";
import MissionSection from "@/components/site/MissionSection";
// import BrandSection from "@/components/site/BrandSection";
import IssueContentsSection from "@/components/site/IssueContentsSection";
import AuthorsSection from "@/components/site/AuthorsSection";
import ShowcaseStrip from "@/components/site/ShowcaseStrip";
import FrameworkSection from "@/components/site/FrameworkSection";
import DispatchesSection from "@/components/site/DispatchesSection";
import IssueOfferSection from "@/components/site/IssueOfferSection";
import FaqSection from "@/components/site/FaqSection";
import IssueReserveSection from "@/components/site/IssueReserveSection";
import ReaderFeedbackSection from "@/components/site/ReaderFeedbackSection";
import PurchaseNudgePopup from "@/components/site/PurchaseNudgePopup";

export default function LandingPage() {
  return (
    <>
      <PurchaseNudgePopup />
      <HeroSection />
      <MissionSection />
      <ReaderFeedbackSection />
      {/* <BrandSection /> */}
      <IssueContentsSection />
      <AuthorsSection />
      <ShowcaseStrip />
      <FrameworkSection />
      <DispatchesSection />
      <IssueOfferSection />
      <FaqSection />
      <IssueReserveSection />
      {/* <EditionsSection /> */}
      {/* <OjasSection /> */}
    </>
  );
}
