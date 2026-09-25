import { PlaceholderScreen } from '../../components/PlaceholderScreen';
import { useLanguage } from '../../lib/i18n';

export default function Wishlist() {
  const { t } = useLanguage();
  return <PlaceholderScreen title={t('wishlist.title')} description={t('wishlist.description')} />;
}
