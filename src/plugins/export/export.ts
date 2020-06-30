import { PluginBase } from "../plugin-base";

export class SvgExporter extends PluginBase {
    rendered = 0
    renderCyclesToWait = 1

    constructor(renderCyclesToWait = 1) {
        super()

        this.renderCyclesToWait = renderCyclesToWait
    }

    applyStyleInner(el: Element, defaultStyle: CSSStyleDeclaration) {
        const s = getComputedStyle(el);
        for (let idx = 0; idx < s.length; idx++) {
            const key = s.item(idx)
            const newValue = s.getPropertyValue(key)
            if (newValue != defaultStyle.getPropertyValue(key)) {
                // @ts-ignore
                el.style.setProperty(key, newValue)
            }
        }
        for (const child of el.children) {
            this.applyStyleInner(child, defaultStyle)
        }
    }

    afterRender() {
        if (this.rendered < this.renderCyclesToWait) {
            this.rendered++
            return console.log(`Waiting ${(this.renderCyclesToWait - this.rendered) || "no"} more render cycles before exporting SVG`)
        }
        const start = new Date()
        const svg = document.getElementById("svg")
        const defaultStyle = getComputedStyle(document.body)
        try {
            this.applyStyleInner(svg, defaultStyle)
        }
        catch (er) {
            console.error("An error occurred while applying inline styles", er)
            return
        }
        finally {
            const duration = (new Date().getTime() - start.getTime()) / 1000
            console.log(`Rendering inline styles took ${duration} seonds`)
        }

        // Now, we can grab the svg element, dump it to disk
        const data = this.serializeXML();
        this.downloadURL(data)
    }

    serializeXML() {
        //get svg element.
        var svg = document.getElementById("svg");

        //get svg source.
        var serializer = new XMLSerializer();
        var source = serializer.serializeToString(svg);

        //add name spaces.
        if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
            source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
        }
        if (!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)) {
            source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
        }

        //add xml declaration
        source = '<?xml version="1.0" standalone="no"?>\r\n' + source;

        //convert svg source to URI data scheme.
        var url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);

        return url
    }

    downloadURL(url: string, name = "workflow.svg") {
        var dl = document.createElement('a');
        dl.setAttribute('href', url);
        dl.setAttribute('download', name);
        dl.click();
        dl.remove();
    }
}