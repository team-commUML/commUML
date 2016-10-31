package commuml;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class DrawingController {

    @RequestMapping("/draw")
    public String drawingBoard(@RequestParam(value = "id", required = false, defaultValue = "12356290690AFGSJIOD") String name, Model model) {
        model.addAttribute("id", name);
        return "commuml-draw";
    }

}
