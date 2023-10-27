(ns metabase.query-processor.postprocess
  (:require
   [metabase.public-settings.premium-features :refer [defenterprise]]
   [metabase.query-processor.middleware.add-dimension-projections :as qp.add-dimension-projections]
   [metabase.query-processor.middleware.add-rows-truncated :as qp.add-rows-truncated]
   [metabase.query-processor.middleware.add-timezone-info :as qp.add-timezone-info]
   [metabase.query-processor.middleware.annotate :as annotate]
   [metabase.query-processor.middleware.cumulative-aggregations :as qp.cumulative-aggregations]
   [metabase.query-processor.middleware.format-rows :as format-rows]
   [metabase.query-processor.middleware.large-int-id :as large-int-id]
   [metabase.query-processor.middleware.limit :as limit]
   [metabase.query-processor.middleware.mbql-to-native :as mbql-to-native]
   [metabase.query-processor.middleware.results-metadata :as results-metadata]
   [metabase.query-processor.middleware.splice-params-in-response :as splice-params-in-response]
   [metabase.query-processor.middleware.visualization-settings :as
    viz-settings]))

(defenterprise ee-middleware-merge-sandboxing-metadata
  "EE-only: merge in column metadata from the original, unsandboxed version of the query."
  metabase-enterprise.sandbox.query-processor.middleware.row-level-restrictions
  [_query rff]
  rff)

(defenterprise ee-middleware-limit-download-result-rows
  "EE-only: limit the number of rows included in downloads if the user has `limited` download perms. Mainly useful for
  native queries, which are not modified by the [[apply-download-limit]] pre-processing middleware."
  metabase-enterprise.advanced-permissions.query-processor.middleware.permissions
  [_query rff]
  rff)

(def ^:private middleware
  "Post-processing middleware that transforms results. Has the form

    (f preprocessed-query rff) -> rff

  Where `rff` has the form

    (f metadata) -> rf

  and `rf` is a normal reducing function as you'd pass to [[clojure.core/transduce]]."
  [#'results-metadata/record-and-return-metadata!
   #'limit/limit-result-rows
   #'ee-middleware-limit-download-result-rows
   #'qp.add-rows-truncated/add-rows-truncated
   #'splice-params-in-response/splice-params-in-response
   #'qp.add-timezone-info/add-timezone-info
   #'ee-middleware-merge-sandboxing-metadata
   #'qp.add-dimension-projections/remap-results
   #'format-rows/format-rows
   #'large-int-id/convert-id-to-string
   #'viz-settings/update-viz-settings
   #'qp.cumulative-aggregations/sum-cumulative-aggregation-columns
   #'annotate/add-column-info
   #'mbql-to-native/add-native-query-to-metadata])
;;; ↑↑↑ POST-PROCESSING ↑↑↑ happens from BOTTOM TO TOP

(defn postprocessing-rff [query rff]
  (reduce
   (fn [rff middleware-fn]
     (middleware-fn query rff))
   rff
   middleware))

(defn postprocess [query rff initial-metadata reducible-rows]
  (let [rff (postprocessing-rff query rff)
        rf  (rff initial-metadata)]
    (transduce
     identity
     rf
     reducible-rows)))
