CREATE TABLE app_meta (
    meta_key   VARCHAR(100) PRIMARY KEY,
    meta_value VARCHAR(500)
);

INSERT INTO app_meta (meta_key, meta_value) VALUES ('schema_baseline', 'V1');
