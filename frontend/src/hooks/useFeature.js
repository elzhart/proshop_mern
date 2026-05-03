import { useFeaturesContext, isFeatureActive } from '../context/FeaturesContext'

const useFeature = (featureId) => {
  const { features, bucket } = useFeaturesContext()
  const feature = features[featureId]
  return {
    active: isFeatureActive(feature, bucket),
    feature: feature || null,
  }
}

export default useFeature