(ns metabase.query-processor.preprocess
  (:require
   [metabase.lib.convert :as lib.convert]
   [metabase.lib.core :as lib]
   [metabase.public-settings.premium-features :refer [defenterprise]]
   [metabase.query-processor.error-type :as qp.error-type]
   [metabase.query-processor.middleware.add-default-temporal-unit :as qp.add-default-temporal-unit]
   [metabase.query-processor.middleware.add-dimension-projections :as qp.add-dimension-projections]
   [metabase.query-processor.middleware.add-implicit-clauses :as qp.add-implicit-clauses]
   [metabase.query-processor.middleware.add-implicit-joins :as qp.add-implicit-joins]
   [metabase.query-processor.middleware.add-source-metadata :as qp.add-source-metadata]
   [metabase.query-processor.middleware.auto-bucket-datetimes :as qp.auto-bucket-datetimes]
   [metabase.query-processor.middleware.auto-parse-filter-values :as auto-parse-filter-values]
   [metabase.query-processor.middleware.binning :as binning]
   [metabase.query-processor.middleware.check-features :as check-features]
   [metabase.query-processor.middleware.constraints :as qp.constraints]
   [metabase.query-processor.middleware.cumulative-aggregations :as qp.cumulative-aggregations]
   [metabase.query-processor.middleware.desugar :as desugar]
   [metabase.query-processor.middleware.escape-join-aliases :as escape-join-aliases]
   [metabase.query-processor.middleware.expand-macros :as expand-macros]
   [metabase.query-processor.middleware.fix-bad-references :as fix-bad-refs]
   [metabase.query-processor.middleware.limit :as limit]
   [metabase.query-processor.middleware.optimize-temporal-filters :as optimize-temporal-filters]
   [metabase.query-processor.middleware.parameters :as parameters]
   [metabase.query-processor.middleware.permissions :as qp.perms]
   [metabase.query-processor.middleware.persistence :as qp.persistence]
   [metabase.query-processor.middleware.pre-alias-aggregations :as qp.pre-alias-aggregations]
   [metabase.query-processor.middleware.reconcile-breakout-and-order-by-bucketing :as reconcile-bucketing]
   [metabase.query-processor.middleware.resolve-fields :as qp.resolve-fields]
   [metabase.query-processor.middleware.resolve-joined-fields :as resolve-joined-fields]
   [metabase.query-processor.middleware.resolve-joins :as resolve-joins]
   [metabase.query-processor.middleware.resolve-referenced :as qp.resolve-referenced]
   [metabase.query-processor.middleware.resolve-source-table :as qp.resolve-source-table]
   [metabase.query-processor.middleware.upgrade-field-literals :as upgrade-field-literals]
   [metabase.query-processor.middleware.validate :as validate]
   [metabase.query-processor.middleware.validate-temporal-bucketing :as validate-temporal-bucketing]
   [metabase.query-processor.middleware.wrap-value-literals :as qp.wrap-value-literals]
   [metabase.query-processor.normalize :as qp.normalize]
   [metabase.query-processor.setup :as qp.setup]
   [metabase.util.i18n :as i18n :refer [tru]]))

(defenterprise ee-middleware-apply-download-limit
  "EE-only: apply a limit to the number of rows for downloads based on EE user perms."
  metabase-enterprise.advanced-permissions.query-processor.middleware.permissions
  [query]
  query)

(defenterprise ee-middleware-apply-sandboxing
  "EE-only: apply sandboxing to the current query."
  metabase-enterprise.sandbox.query-processor.middleware.row-level-restrictions
  [query]
  query)

(def ^:private middleware
  "Pre-processing middleware. Has the form

    (f query) -> query"
  ;; ↓↓↓ PRE-PROCESSING ↓↓↓ happens from TOP TO BOTTOM
  #_{:clj-kondo/ignore [:deprecated-var]}
  [#'qp.normalize/normalize
   #'qp.perms/remove-permissions-key
   #'validate/validate-query
   #'qp.constraints/add-default-userland-constraints
   #'expand-macros/expand-macros
   #'qp.resolve-referenced/resolve-referenced-card-resources
   #'parameters/substitute-parameters
   #'qp.resolve-source-table/resolve-source-tables
   #'qp.auto-bucket-datetimes/auto-bucket-datetimes
   #'reconcile-bucketing/reconcile-breakout-and-order-by-bucketing
   #'qp.add-source-metadata/add-source-metadata-for-source-queries
   #'upgrade-field-literals/upgrade-field-literals
   #'ee-middleware-apply-sandboxing
   #'qp.persistence/substitute-persisted-query
   #'qp.add-implicit-clauses/add-implicit-clauses
   #'qp.add-dimension-projections/add-remapped-columns
   #'qp.resolve-fields/resolve-fields
   #'binning/update-binning-strategy
   #'desugar/desugar
   #'qp.add-default-temporal-unit/add-default-temporal-unit
   #'qp.add-implicit-joins/add-implicit-joins
   #'resolve-joins/resolve-joins
   #'resolve-joined-fields/resolve-joined-fields
   #'fix-bad-refs/fix-bad-references
   #'escape-join-aliases/escape-join-aliases
   ;; yes, this is called a second time, because we need to handle any joins that got added
   #'ee-middleware-apply-sandboxing
   #'qp.cumulative-aggregations/rewrite-cumulative-aggregations
   #'qp.pre-alias-aggregations/pre-alias-aggregations
   #'qp.wrap-value-literals/wrap-value-literals
   #'auto-parse-filter-values/auto-parse-filter-values
   #'validate-temporal-bucketing/validate-temporal-bucketing
   #'optimize-temporal-filters/optimize-temporal-filters
   #'limit/add-default-limit
   #'ee-middleware-apply-download-limit
   #'check-features/check-features])

(def ^:private ^:dynamic *preprocessing-level* 1)

(def ^:private ^:const max-preprocessing-level 20)

(defn- do-with-max-preprocessing-level [thunk]
  (binding [*preprocessing-level* (inc *preprocessing-level*)]
    (when (>= *preprocessing-level* max-preprocessing-level)
      (throw (ex-info (str (tru "Infinite loop detected: recursively preprocessed query {0} times."
                                max-preprocessing-level))
                      {:type qp.error-type/qp})))
    (thunk)))

(defn preprocess
  [query]
  (qp.setup/do-with-qp-setup
   query
   (^:once fn* [query]
    (do-with-max-preprocessing-level
     (^:once fn* []
      (try
        (reduce
         (fn [query middleware-fn]
           (middleware-fn query))
         query
         middleware)
        (catch Throwable e
          (throw (ex-info (i18n/tru "Error preprocessing query: {0}" (ex-message e))
                          {:query query, :type qp.error-type/qp}
                          e)))))))))
