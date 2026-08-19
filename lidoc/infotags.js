// ================================
//   Verarbeitung Filter von Tags
// ================================
// @ts-check

import { DataTable } from "./infotable.js";

// =====================================
//   Typen
// ---------

/**
 * Liste mit Seiten und Tags
 * @typedef {Object} Site
 * @property {string} site - ID/ Url der seite "#/lidoc/test" ohne Dateiendung
 * @property {string} title - Tietel/Text der für die Seite angezeigt wird
 * @property {Set<string>} tags - Liste mit Tags zu dieser seite
 */
const Site_fields = ["site", "title", "tags"];

/**
 * Liste mit allen Tags und Seiten
 * @typedef {Object} Tag
 * @property {string} tag - Eindeutiger Tagname
 * @property {Set<number>} sites - List mit SeitenIndex zu dem Tag
 */
const Tag_fields = ["tag", "sites"]

// ================
//   Klassen
// ----------

export class InfoTag {
    /** @type {DataTable<Site>} */
    site_list = new DataTable("SiteList", [Site_fields], "site");

    /** @type {DataTable<Tag>} */
    tag_list = new DataTable("TagList", [Tag_fields], "tag");

    /**
     * Stellt aus allen Seiten die Liste mit Tags zusammen
     */
    sites_to_tags() {
        // taglist löschen
        this.tag_list = new DataTable("TagList", [Tag_fields], "tag");
        const tag_list = this.tag_list;

        /**
         * Fügt eine Seite der TagListe hinzu
         * @param {Site} site - SeitenID/Url
         * @param {number} [index] - Index des Seiten Datensatzes
         */
        function add_site(site, index) {
            for (const tag in site.tags) {
                tag_list.addCellSetValue(tag, "sites", index);
            }
        }

        // Alle seiten durchgehen
        this.site_list.forEach(add_site);
    }

    /**
     * Liefert vom Angegeben Tagnamen alle verknüpften tags zurück, ausser den eigenen TagName
     * @param {string} tag_name - Tagname von dem alle verknüpften tags gesucht werden
     * @returns {Array<string>} Liste mit verknüpften tags
     */
    getSubTags(tag_name) {
        /** @type {Array<number>} Liste mit allen Seiten Indexes */
        const sites = [...this.tag_list.getCellValue(tag_name, "sites").values()];

        /** @type {Set<string>} */
        const sub_tag_list = new Set();

        /**
         * Fügt alle Tags von einer Seite der TagListe hinzu
         * @param {Site} site - SeitenID/Url
         */
        function add_tags(site) {
            for (const tag in site.tags) {
                if (tag != tag_name) {
                    sub_tag_list.add(tag);
                }
            }
        }

        // Alle Seiten-Indexes vom Tag durchgehen
        this.site_list.forEach(add_tags, sites);

        return [...sub_tag_list];
    }
}

