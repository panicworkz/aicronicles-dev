import TagArchivePage, {
  generateMetadata as tagMetadata,
} from "../../tag/[slug]/page";

export const dynamic = "force-dynamic";
export const generateMetadata = tagMetadata;
export default TagArchivePage;
