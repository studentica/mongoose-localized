/**
 * mongoose-multilang
 *
 * Plugin for mongoose ORM that supports multilingual resources
 *
 * @author Florian Reifschneider <florian@studentica.co>
 */

var removePath = function(schema, path) {
    delete schema.paths[path];
    delete schema.tree[path];
};

var localizedPlugin = function(schema, options) {
    schema.locales = options.locales || ["en"];
    schema.defaultLocale = options.defaultLocale || "en";

    var localizedFields = {};

    schema.eachPath(function(path, schemaType) {
        var options = schemaType.options;
        if(options.localized) {
            localizedField = {};
            schema.locales.forEach(function(locale) {
                localizedField[locale] = {"type": [String]};
                if(locale === schema.defaultLocale) localizedField[locale].required = true;
            });
            localizedFields[path] = localizedField;
        }
    });

    for(var path in localizedFields) {
        removePath(schema, path);
    }
    schema.add(localizedFields);

    schema.methods.setLocale = function(locale) {
        this._locale = locale;
    };

    schema.getLocale = function() {
        return this._locale;
    };

    schema.statics.createLocalizedQuery = function(query) {
        for(var path in query) {
            if(localizedFields[path]) {
                var localizedQueries = [];
                schema.locales.forEach(function(locale) {
                    var q = {};
                    q[path+"."+locale] = query[path];
                    localizedQueries.push(q);
                });
                delete query[path];
                query["$or"] = localizedQueries;
            }
        }
        return query;
    };

    var transform = function(doc, ret, options) {
        if(doc.schema == schema) {
            for(var field in localizedFields) {
                var fieldValue = null;
                if(doc[field][doc._locale]) {
                    fieldValue = doc[field][doc._locale];
                }
                else {
                    fieldValue = doc[field][schema.defaultLocale];
                }
                if(fieldValue) {
                    ret[field] = fieldValue[0];
                }
            }
        }
        return ret;
    };

    schema.set("toJSON", {
        "transform": transform
    });

    schema.set("toObject", {
        "transform": transform
    });
};

module.exports = localizedPlugin;